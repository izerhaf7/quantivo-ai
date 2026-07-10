"""Facebook Search module using SocialAPIs REST API.

Outputs RawDataItem with source_type=FORUM.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx

from contracts import RawDataItem, ScopeConfig, SourceType

logger = logging.getLogger(__name__)

FACEBOOK_SEARCH_POSTS = "https://api.socialapis.io/facebook/search/posts"


class FacebookSearchModule:
    """Facebook post search via SocialAPIs with internal circuit-breaker."""

    name = "facebook_search"

    def __init__(self, api_key: Optional[str] = None, timeout: float = 30.0):
        self.api_key = api_key or os.getenv("SOCIALAPIS_API_KEY")
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None
        self._healthy = True

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    def is_healthy(self) -> bool:
        return self._healthy and bool(self.api_key)

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Fetch Facebook posts relevant to the business scope."""
        if not self.api_key:
            logger.warning("SOCIALAPIS_API_KEY not set, skipping Facebook module")
            self._healthy = False
            return []

        try:
            return await self._search(scope)
        except Exception as e:  # noqa: BLE001
            logger.warning("Facebook search failed: %s", e)
            self._healthy = False
            return []

    async def _search(self, scope: ScopeConfig) -> list[RawDataItem]:
        inp = scope.business_input
        loc = inp.location
        query = f"{inp.business_type} {loc.city}"
        resp = await self.client.get(
            FACEBOOK_SEARCH_POSTS,
            headers={"x-api-token": self.api_key or ""},
            params={"query": query, "recent_posts": "true"},
        )
        resp.raise_for_status()
        data = resp.json()
        posts = data.get("data", {}).get("items", [])

        items: list[RawDataItem] = []
        for post in posts:
            basic = post.get("basic_info", {})
            owner = post.get("owner_info", {})
            text = basic.get("post_text") or ""
            if not text:
                continue
            owner_name = owner.get("owner_name") or "facebook"
            post_id = basic.get("post_id") or post.get("post_id") or ""
            items.append(
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.FORUM,
                    source_name=owner_name,
                    url=basic.get("url") or post.get("url"),
                    title=f"Facebook post by {owner_name}",
                    raw_text=text,
                    lang_hint="id",
                    published_at=self._parse_date(basic.get("created_time") or post.get("created_time")),
                    geo_hint=loc,
                    raw_meta={
                        "platform": "facebook",
                        "query": query,
                        "post_id": post_id,
                        "feedback_details": post.get("feedback_details", {}),
                    },
                )
            )

        logger.info("FacebookSearchModule: returned %d items", len(items))
        return items

    @staticmethod
    def _parse_date(value: Optional[str]) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return None


class MockFacebookSearchModule:
    """Mock Facebook search module returning deterministic fixture data."""

    name = "facebook_search_mock"

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
                source_type=SourceType.FORUM,
                source_name="Komunitas Kuliner Lokal",
                url="https://facebook.com/groups/mock/posts/123",
                title=f"Diskusi Facebook: {inp.business_type} {loc.city}",
                raw_text=(
                    f"Warga {loc.city} sedang membahas {inp.business_type}. "
                    "Banyak yang cari tempat dekat rumah, harga terjangkau, dan rasa konsisten."
                ),
                lang_hint="id",
                published_at=datetime.now(timezone.utc),
                geo_hint=loc,
                raw_meta={"platform": "facebook", "post_id": "mock_fb_123"},
            )
        ]
