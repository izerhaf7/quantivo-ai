"""Google Trends module using pytrends (unofficial) with SerpApi fallback.

Outputs RawDataItem with source_type=TRENDS.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential_jitter,
    retry_if_exception_type,
)

from contracts import (
    RawDataItem,
    ScopeConfig,
    SourceType,
)

logger = logging.getLogger(__name__)

SERPAPI_TRENDS = "https://serpapi.com/search.json"


class TrendsModule:
    """Google Trends scraper via SerpApi (official) with pytrends fallback.

    Note: pytrends is unofficial and fragile. SerpApi is recommended for hackathon.
    """

    name = "google_trends"

    def __init__(
        self,
        serpapi_key: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.serpapi_key = serpapi_key or os.getenv("SERPAPI_API_KEY")
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
        return self._healthy and bool(self.serpapi_key)

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Fetch Google Trends data for business-related keywords."""
        if not self.serpapi_key:
            logger.warning("SERPAPI_API_KEY not set, skipping Trends module")
            self._healthy = False
            return []

        items: list[RawDataItem] = []
        inp = scope.business_input
        loc = inp.location

        keywords = self._build_keywords(inp, loc)

        for kw in keywords[:5]:  # Cap at 5 keywords
            try:
                data = await self._fetch_trends(kw, loc)
                if data:
                    items.append(self._make_item(scope, kw, data, loc))
            except Exception as e:  # noqa: BLE001
                logger.warning("Trends fetch failed for '%s': %s", kw, e)

        logger.info("Trends module: returned %d items for scope %s", len(items), scope.scope_id)
        return items

    def _build_keywords(self, inp, loc) -> list[str]:
        """Build trend keywords from business context."""
        keywords = [inp.business_type]

        # Add category-specific terms
        cat_keywords = {
            "food_beverage": ["kopi", "cafe", "kedai kopi", "minuman"],
            "retail": ["toko", "belanja", "ritel"],
            "fashion": ["fashion", "pakaian", "outfit"],
            "beauty": ["kecantikan", "skincare", "salon"],
            "services": ["jasa", "bengkel", "laundry"],
        }
        keywords.extend(cat_keywords.get(inp.category.value, []))

        # Add location
        if loc.city:
            keywords.append(f"{inp.business_type} {loc.city}")

        # Add goal-specific
        for goal in inp.primary_goals:
            if goal.value == "measure_demand":
                keywords.append(f"permintaan {inp.business_type}")
            elif goal.value == "know_competitors":
                keywords.append(f"kompetitor {inp.business_type}")

        return list(dict.fromkeys(keywords))  # dedupe

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _fetch_trends(self, keyword: str, loc) -> Optional[dict]:
        """Fetch trend data via SerpApi."""
        params = {
            "engine": "google_trends",
            "q": keyword,
            "api_key": self.serpapi_key,
            "hl": "id",
            "geo": "ID",  # Indonesia
            "date": "today 12-m",  # Last 12 months
        }

        if loc.province:
            # Map province to Google Trends geo code
            geo_map = {
                "Jawa Barat": "ID-JB",
                "DKI Jakarta": "ID-JK",
                "Jawa Tengah": "ID-JT",
                "Jawa Timur": "ID-JI",
                "Banten": "ID-BT",
            }
            params["geo"] = geo_map.get(loc.province, "ID")

        resp = await self.client.get(SERPAPI_TRENDS, params=params)
        resp.raise_for_status()
        return resp.json()

    def _make_item(self, scope: ScopeConfig, keyword: str, data: dict, loc) -> RawDataItem:
        """Convert SerpApi trends response to RawDataItem."""
        interest_over_time = data.get("interest_over_time", {})
        timeline = interest_over_time.get("timeline_data", [])
        related_topics = data.get("related_topics", {})
        related_queries = data.get("related_queries", {})

        # Calculate trend direction
        values = [point.get("values", [{}])[0].get("extracted_value", 0) for point in timeline[-12:]]
        if len(values) >= 2:
            recent_avg = sum(values[-3:]) / 3
            older_avg = sum(values[-6:-3]) / 3
            trend_pct = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
            trend_dir = "naik" if trend_pct > 5 else "turun" if trend_pct < -5 else "stabil"
        else:
            trend_pct = 0
            trend_dir = "data tidak cukup"

        # Build summary
        top_related = []
        for topic in related_topics.get("rising", [])[:3]:
            top_related.append(f"{topic.get('topic', '')} (+{topic.get('value', '')}%)")
        for query in related_queries.get("rising", [])[:3]:
            top_related.append(f"'{query.get('query', '')}' (+{query.get('value', '')}%)")

        raw_text = (
            f"Google Trends untuk '{keyword}' (Indonesia, 12 bulan): "
            f"tren {trend_dir} ({trend_pct:+.1f}% vs 3 bulan lalu). "
            f"Topik/kuueri naik: {', '.join(top_related[:5]) or 'tidak ada'}."
        )

        return RawDataItem(
            scope_id=scope.scope_id,
            source_type=SourceType.TRENDS,
            source_name="google_trends",
            url=f"https://trends.google.com/trends/explore?q={keyword}&geo=ID",
            title=f"Trend: {keyword}",
            raw_text=raw_text,
            lang_hint="id",
            published_at=datetime.now(timezone.utc).isoformat(),
            geo_hint=loc,
            raw_meta={
                "keyword": keyword,
                "timeline_points": len(timeline),
                "trend_pct": trend_pct,
                "trend_direction": trend_dir,
                "related_topics_rising": related_topics.get("rising", [])[:5],
                "related_queries_rising": related_queries.get("rising", [])[:5],
            },
        )


# ---- Mock ----
class MockTrendsModule:
    name = "google_trends_mock"

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
                source_type=SourceType.TRENDS,
                source_name="google_trends_mock",
                url="https://trends.google.com/trends/explore?q=kopi&geo=ID",
                title="Trend: kopi",
                raw_text=(
                    "Google Trends untuk 'kopi' (Indonesia, 12 bulan): tren naik (+18% vs 3 bulan lalu). "
                    "Topik naik: 'kopi specialty' (+45%), 'manual brew' (+38%), 'kopi kenangan' (+32%). "
                    "Query naik: 'kedai kopi terdekat' (+52%), 'harga kopi' (+28%)."
                ),
                lang_hint="id",
                published_at=datetime.now(timezone.utc).isoformat(),
                geo_hint=loc,
                raw_meta={
                    "keyword": "kopi",
                    "trend_pct": 18.0,
                    "trend_direction": "naik",
                    "related_topics_rising": [
                        {"topic": "kopi specialty", "value": 45},
                        {"topic": "manual brew", "value": 38},
                        {"topic": "kopi kenangan", "value": 32},
                    ],
                    "related_queries_rising": [
                        {"query": "kedai kopi terdekat", "value": 52},
                        {"query": "harga kopi", "value": 28},
                    ],
                },
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.TRENDS,
                source_name="google_trends_mock",
                url="https://trends.google.com/trends/explore?q=cafe&geo=ID",
                title="Trend: cafe",
                raw_text=(
                    "Google Trends untuk 'cafe' (Indonesia, 12 bulan): tren stabil (+2%). "
                    "Topik naik: 'cafe aesthetic' (+41%), 'cafe kerja' (+35%), 'cafe 24 jam' (+27%). "
                    "Query naik: 'cafe cozy jakarta' (+44%), 'cafe wifi cepat' (+31%)."
                ),
                lang_hint="id",
                published_at=datetime.now(timezone.utc).isoformat(),
                geo_hint=loc,
                raw_meta={
                    "keyword": "cafe",
                    "trend_pct": 2.0,
                    "trend_direction": "stabil",
                    "related_topics_rising": [
                        {"topic": "cafe aesthetic", "value": 41},
                        {"topic": "cafe kerja", "value": 35},
                        {"topic": "cafe 24 jam", "value": 27},
                    ],
                    "related_queries_rising": [
                        {"query": "cafe cozy jakarta", "value": 44},
                        {"query": "cafe wifi cepat", "value": 31},
                    ],
                },
            ),
        ]
        logger.info("MockTrendsModule: returned %d items", len(items))
        return items