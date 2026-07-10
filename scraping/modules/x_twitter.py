"""X/Twitter module using BrightData URL-based scraper.

Discovers X URLs with BrightData Google Search, then scrapes posts.
Outputs RawDataItem with source_type=NEWS.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx

from contracts import RawDataItem, ScopeConfig, SourceType

logger = logging.getLogger(__name__)

BRIGHTDATA_BASE = "https://api.brightdata.com/datasets/v3"
GOOGLE_SEARCH_DATASET_ID = "gd_lkszv50tgnm7bqmfp"  # BrightData google_search
X_POSTS_DATASET_ID = "gd_lwxkxvnf1cynvib9co"


class XModule:
    """X/Twitter URL scraper via BrightData with graceful empty handling."""

    name = "brightdata_x"

    def __init__(self, api_key: Optional[str] = None, timeout: float = 60.0, max_urls: int = 10):
        self.api_key = api_key or os.getenv("BRIGHTDATA_API_KEY")
        self.timeout = timeout
        self.max_urls = max_urls
        self._healthy = True

    def is_healthy(self) -> bool:
        return self._healthy and bool(self.api_key)

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Fetch X/Twitter posts relevant to the business scope."""
        if not self.api_key:
            logger.warning("BRIGHTDATA_API_KEY not set, skipping X module")
            self._healthy = False
            return []

        inp = scope.business_input
        loc = inp.location
        query = f"site:x.com OR site:twitter.com {inp.business_type} {loc.city}"
        try:
            urls = self._scope_urls(scope)
            if not urls:
                urls = await self._discover_x_urls(query)
            if not urls:
                return []
            rows = await self._scrape_urls(X_POSTS_DATASET_ID, urls[: self.max_urls])
            return self._parse_items(scope, rows, query)
        except Exception as e:  # noqa: BLE001
            logger.warning("BrightData X fetch failed: %s", e)
            self._healthy = False
            return []

    def _scope_urls(self, scope: ScopeConfig) -> list[str]:
        urls = [kw for kw in scope.search_keywords if "x.com" in kw or "twitter.com" in kw]
        for competitor in scope.business_input.known_competitors:
            if "x.com" in competitor or "twitter.com" in competitor:
                urls.append(competitor)
        return list(dict.fromkeys(urls))

    async def _discover_x_urls(self, query: str) -> list[str]:
        rows = await self._scrape_urls(GOOGLE_SEARCH_DATASET_ID, [f"https://www.google.com/search?q={query}"])
        urls: list[str] = []
        for row in rows:
            for key in ("url", "link", "displayed_link"):
                value = row.get(key)
                if isinstance(value, str) and ("x.com" in value or "twitter.com" in value):
                    urls.append(value)
        return list(dict.fromkeys(urls))

    async def _scrape_urls(self, dataset_id: str, urls: list[str]) -> list[dict]:
        url = f"{BRIGHTDATA_BASE}/scrape?dataset_id={dataset_id}&format=json"
        body = [{"url": item_url} for item_url in urls]
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                url,
                json=body,
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            return self._parse_response(resp.text)

    @staticmethod
    def _parse_response(raw: str) -> list[dict]:
        raw = raw.strip()
        if not raw:
            return []
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return [json.loads(line) for line in raw.splitlines() if line.strip()]
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            return data.get("data", []) or data.get("items", []) or [data]
        return []

    def _parse_items(self, scope: ScopeConfig, rows: list[dict], query: str) -> list[RawDataItem]:
        loc = scope.business_input.location
        items: list[RawDataItem] = []
        for row in rows:
            text = row.get("text") or row.get("tweet") or row.get("content") or ""
            if not text:
                continue
            username = row.get("username") or row.get("user_name") or row.get("author") or "x"
            items.append(
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.NEWS,
                    source_name=str(username),
                    url=row.get("url") or row.get("tweet_url"),
                    title=f"X post by @{username}",
                    raw_text=str(text),
                    lang_hint="id",
                    published_at=self._parse_date(row.get("date") or row.get("created_at")),
                    geo_hint=loc,
                    raw_meta={"platform": "x", "query": query, "likes": row.get("likes"), "reposts": row.get("retweets")},
                )
            )
        return items

    @staticmethod
    def _parse_date(value: Optional[str]) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return None


class MockXModule:
    """Mock X/Twitter module returning deterministic fixture data."""

    name = "brightdata_x_mock"

    def __init__(self):
        self._healthy = True

    def is_healthy(self) -> bool:
        return self._healthy

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        inp = scope.business_input
        loc = inp.location
        return [
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.NEWS,
                source_name="x_mock",
                url="https://x.com/mock/status/123",
                title=f"X discussion: {inp.business_type} {loc.city}",
                raw_text=f"Thread lokal: {inp.business_type} di {loc.city} mulai ramai dibicarakan, terutama soal antrean, harga, dan lokasi strategis.",
                lang_hint="id",
                published_at=datetime.now(timezone.utc),
                geo_hint=loc,
                raw_meta={"platform": "x", "likes": 95, "reposts": 14},
            )
        ]
