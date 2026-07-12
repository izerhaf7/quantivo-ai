"""BrightData TikTok Scraper module.

Discovers TikTok posts by keyword via BrightData's Social Media Scraper API.
Uses async trigger → poll snapshot → parse NDJSON pattern.

Outputs RawDataItem with source_type=SOCIAL.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx

from contracts import (
    RawDataItem,
    ScopeConfig,
    SourceType,
)

logger = logging.getLogger(__name__)

BRIGHTDATA_BASE = "https://api.brightdata.com/datasets/v3"
TIKTOK_DATASET_ID = "gd_lu702nij2f790tmv9h"  # TikTok discover by keyword


class BrightDataTiktokModule:
    """TikTok post discovery via BrightData Social Media Scraper API.

    Flow: trigger async job → poll snapshot → parse NDJSON results.
    Circuit-breaker: on failure/limit, returns [] + logs warning.
    """

    name = "brightdata_tiktok"

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: float = 60.0,
        max_posts: int = 15,
        poll_max_wait: float = 200.0,
    ):
        self.api_key = api_key or os.getenv("BRIGHTDATA_API_KEY")
        self.timeout = timeout
        self.max_posts = max_posts
        self.poll_max_wait = poll_max_wait
        # Read by ScraperRunner._run_module's outer asyncio.wait_for instead
        # of the shared MODULE_TIMEOUT_SECONDS default (see runner.py). Must
        # exceed trigger time + poll_max_wait with real headroom -- previously
        # the outer timeout (180s) and this module's own poll deadline (also
        # 180s, but starting *after* the trigger call) were numerically equal
        # but didn't share a clock, so the outer wait_for always fired first
        # and killed the in-flight poll request before BrightData's job (or
        # this module's own graceful timeout) ever got to finish. BrightData
        # keeps running the job server-side regardless of us disconnecting --
        # that's why the job can show as completed on their dashboard even
        # though our side logged a timeout.
        self.timeout_seconds = timeout + poll_max_wait + 20.0
        self._healthy = True

    def is_healthy(self) -> bool:
        return self._healthy and bool(self.api_key)

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Fetch TikTok posts relevant to the business scope."""
        if not self.api_key:
            logger.warning("BRIGHTDATA_API_KEY not set, skipping TikTok module")
            self._healthy = False
            return []

        inp = scope.business_input
        loc = inp.location
        keyword = self._build_keyword(inp, loc)

        try:
            snapshot_id = await self._trigger(keyword)
            if not snapshot_id:
                return []

            items_raw = await self._poll_snapshot(snapshot_id, max_wait=self.poll_max_wait)
            return self._parse_items(scope, items_raw, keyword, loc)

        except Exception as e:  # noqa: BLE001
            logger.warning("BrightData TikTok fetch failed: %s", e)
            self._healthy = False
            return []

    def _build_keyword(self, inp, loc) -> str:
        """Build a single search keyword from business context."""
        parts = [inp.business_type]
        if loc.city:
            parts.append(loc.city)
        return " ".join(parts)

    async def _trigger(self, keyword: str) -> Optional[str]:
        """Trigger async TikTok discovery. Returns snapshot_id."""
        url = (
            f"{BRIGHTDATA_BASE}/trigger"
            f"?dataset_id={TIKTOK_DATASET_ID}"
            f"&type=discover_new&discover_by=keyword&format=json"
        )
        body = {"input": [{"search_keyword": keyword, "num_of_posts": self.max_posts}]}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                url,
                json=body,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            snap = data.get("snapshot_id")
            if not snap:
                logger.warning("BrightData trigger returned no snapshot_id: %s", data)
                return None
            logger.info("BrightData TikTok triggered: snapshot=%s", snap)
            return snap

    async def _poll_snapshot(self, snapshot_id: str, max_wait: float = 200.0) -> list[dict]:
        """Poll snapshot until ready. Returns list of post dicts."""
        url = f"{BRIGHTDATA_BASE}/snapshot/{snapshot_id}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        deadline = asyncio.get_event_loop().time() + max_wait

        async with httpx.AsyncClient(timeout=30) as client:
            while asyncio.get_event_loop().time() < deadline:
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
                raw = resp.text

                # Check if still running (single JSON with status field)
                lines = [l.strip() for l in raw.splitlines() if l.strip()]
                if len(lines) == 1:
                    try:
                        status_obj = json.loads(lines[0])
                        if status_obj.get("status") == "running":
                            await asyncio.sleep(10)
                            continue
                    except json.JSONDecodeError:
                        pass

                # Parse NDJSON results
                items = []
                for line in lines:
                    try:
                        items.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
                if items:
                    logger.info("BrightData TikTok snapshot ready: %d posts", len(items))
                    return items

                await asyncio.sleep(10)

        logger.warning("BrightData TikTok snapshot %s timed out", snapshot_id)
        return []

    def _parse_items(
        self, scope: ScopeConfig, items_raw: list[dict], keyword: str, loc
    ) -> list[RawDataItem]:
        """Convert BrightData TikTok posts to RawDataItem list."""
        items: list[RawDataItem] = []
        for post in items_raw:
            desc = post.get("description", "") or ""
            username = post.get("profile_username", "unknown")
            post_url = post.get("url", "")

            # Parse created_at
            pub_at = None
            ct = post.get("create_time")
            if ct:
                try:
                    pub_at = datetime.fromisoformat(ct.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    pass

            # Build raw_text summary
            likes = post.get("digg_count", 0) or 0
            comments = post.get("comment_count", 0) or 0
            plays = post.get("play_count", 0) or 0
            shares = post.get("share_count", 0) or 0

            raw_text = (
                f"TikTok @{username}: {desc[:500]}\n"
                f"[engagement] likes={likes} comments={comments} plays={plays} shares={shares}"
            )

            items.append(
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.SOCIAL,
                    source_name="tiktok",
                    url=post_url,
                    title=f"TikTok @{username}: {desc[:80]}",
                    raw_text=raw_text,
                    lang_hint="id",
                    published_at=pub_at,
                    geo_hint=loc,
                    raw_meta={
                        "keyword": keyword,
                        "profile_username": username,
                        "profile_url": post.get("profile_url", ""),
                        "digg_count": likes,
                        "comment_count": comments,
                        "play_count": plays,
                        "share_count": shares,
                        "collect_count": post.get("collect_count", 0),
                        "video_duration": post.get("video_duration", 0),
                        "hashtags": post.get("hashtags", []),
                        "post_id": post.get("post_id", ""),
                        "platform": "tiktok",
                    },
                )
            )

        return items


# ---- Mock ----
class MockTiktokModule:
    """Mock TikTok module returning deterministic fixture data."""

    name = "brightdata_tiktok_mock"

    def __init__(self):
        self._healthy = True

    def is_healthy(self) -> bool:
        return self._healthy

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        inp = scope.business_input
        loc = inp.location

        items = [
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.SOCIAL,
                source_name="tiktok_mock",
                url="https://www.tiktok.com/@mock_kuepancong/video/123",
                title="TikTok @mock_kuepancong: Kue pancong lumer Depok",
                raw_text=(
                    "TikTok @mock_kuepancong: Kue pancong lumer yang lagi viral di Depok! "
                    "Rasanya gurih dan lumer di mulut. Cocok buat jajanan sore. "
                    "#kuepancong #depok #jajananviral\n"
                    "[engagement] likes=2500 comments=180 plays=85000 shares=320"
                ),
                lang_hint="id",
                published_at=datetime.now(timezone.utc).isoformat(),
                geo_hint=loc,
                raw_meta={
                    "keyword": f"{inp.business_type} {loc.city}",
                    "profile_username": "mock_kuepancong",
                    "profile_url": "https://www.tiktok.com/@mock_kuepancong",
                    "digg_count": 2500,
                    "comment_count": 180,
                    "play_count": 85000,
                    "share_count": 320,
                    "hashtags": ["kuepancong", "depok", "jajananviral"],
                    "platform": "tiktok",
                },
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.SOCIAL,
                source_name="tiktok_mock",
                url="https://www.tiktok.com/@mock_kulinerdepok/video/456",
                title="TikTok @mock_kulinerdepok: Review kue pancong Tapos",
                raw_text=(
                    "TikTok @mock_kulinerdepok: Review kue pancong di Tapos, Depok. "
                    "Harga cuma 5 ribuan. Rasanya autentik Betawi! "
                    "#kulinerdepok #tapos #kuepancong\n"
                    "[engagement] likes=890 comments=45 plays=32000 shares=110"
                ),
                lang_hint="id",
                published_at=datetime.now(timezone.utc).isoformat(),
                geo_hint=loc,
                raw_meta={
                    "keyword": f"{inp.business_type} {loc.city}",
                    "profile_username": "mock_kulinerdepok",
                    "profile_url": "https://www.tiktok.com/@mock_kulinerdepok",
                    "digg_count": 890,
                    "comment_count": 45,
                    "play_count": 32000,
                    "share_count": 110,
                    "hashtags": ["kulinerdepok", "tapos", "kuepancong"],
                    "platform": "tiktok",
                },
            ),
        ]
        logger.info("MockTiktokModule: returned %d items", len(items))
        return items
