"""Web Search module using Tavily API (primary) with Brave fallback.

Implements ScraperModule protocol. Outputs RawDataItem with source_type=NEWS/BLOG/ARTICLE.
"""

from __future__ import annotations

import logging
import os
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
from contracts.interfaces import ScraperModule

logger = logging.getLogger(__name__)

TAVILY_SEARCH = "https://api.tavily.com/search"
BRAVE_SEARCH = "https://api.search.brave.com/res/v1/web/search"


class WebSearchModule:
    """Tavily web search (LLM-optimized) with Brave fallback.

    Circuit-breaker: on quota/limit errors, returns [] + logs warning.
    """

    name = "tavily_web_search"

    def __init__(
        self,
        tavily_api_key: Optional[str] = None,
        brave_api_key: Optional[str] = None,
        timeout: float = 30.0,
        max_results: int = 10,
    ):
        self.tavily_key = tavily_api_key or os.getenv("TAVILY_API_KEY")
        self.brave_key = brave_api_key or os.getenv("BRAVE_SEARCH_API_KEY")
        self.timeout = timeout
        self.max_results = max_results
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
        return self._healthy and (bool(self.tavily_key) or bool(self.brave_key))

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Search for news/blogs/articles relevant to the business scope."""
        if not self.tavily_key and not self.brave_key:
            logger.warning("No web search API keys; WebSearchModule returning empty")
            self._healthy = False
            return []

        items: list[RawDataItem] = []

        # Try Tavily first (better for LLM consumption)
        if self.tavily_key:
            try:
                items = await self._search_tavily(scope)
                if items:
                    return items
            except Exception as e:  # noqa: BLE001
                logger.warning("Tavily search failed, trying Brave: %s", e)

        # Fallback to Brave
        if self.brave_key:
            try:
                items = await self._search_brave(scope)
                return items
            except Exception as e:  # noqa: BLE001
                logger.error("Brave search also failed: %s", e)
                self._healthy = False

        return []

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _search_tavily(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Search via Tavily API."""
        inp = scope.business_input
        loc = inp.location
        where = loc.district or loc.city

        # Build query from business_type + goals + target customers
        query_parts = [inp.business_type, where]
        for goal in inp.primary_goals:
            if goal.value in ("know_competitors", "measure_demand"):
                query_parts.append("kompetitor")
            elif goal.value == "find_product_gap":
                query_parts.append("peluang pasar")
        for tc in inp.target_customers:
            query_parts.append(tc.value.replace("_", " "))

        query = " ".join(query_parts)

        payload = {
            "api_key": self.tavily_key,
            "query": query,
            "search_depth": "advanced",
            "include_answer": False,
            "include_raw_content": True,
            "max_results": self.max_results,
            "include_domains": None,
            "exclude_domains": None,
        }

        resp = await self.client.post(TAVILY_SEARCH, json=payload)
        resp.raise_for_status()
        data = resp.json()

        results = data.get("results", [])
        items: list[RawDataItem] = []

        for r in results:
            url = r.get("url", "")
            source_type = self._classify_source(url)

            items.append(
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=source_type,
                    source_name="tavily",
                    url=url,
                    title=r.get("title", ""),
                    raw_text=r.get("raw_content") or r.get("content", ""),
                    lang_hint=self._detect_lang(r.get("content", "")),
                    published_at=self._parse_date(r.get("published_date")),
                    geo_hint=loc,
                    raw_meta={
                        "score": r.get("score"),
                        "favicon": r.get("favicon"),
                    },
                )
            )

        logger.info("Tavily: found %d results for scope %s", len(items), scope.scope_id)
        return items

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _search_brave(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Fallback search via Brave API."""
        inp = scope.business_input
        loc = inp.location
        where = loc.district or loc.city

        query = f"{inp.business_type} {where} Indonesia 2024"

        headers = {
            "Accept": "application/json",
            "X-Subscription-Token": self.brave_key,
        }
        params = {"q": query, "count": self.max_results, "search_lang": "id"}

        resp = await self.client.get(BRAVE_SEARCH, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

        results = data.get("web", {}).get("results", [])
        items: list[RawDataItem] = []

        for r in results:
            url = r.get("url", "")
            source_type = self._classify_source(url)

            items.append(
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=source_type,
                    source_name="brave",
                    url=url,
                    title=r.get("title", ""),
                    raw_text=r.get("description", ""),
                    lang_hint="id",
                    geo_hint=loc,
                    raw_meta={
                        "age": r.get("age"),
                        "language": r.get("language"),
                    },
                )
            )

        logger.info("Brave: found %d results for scope %s", len(items), scope.scope_id)
        return items

    @staticmethod
    def _classify_source(url: str) -> SourceType:
        """Classify URL into SourceType enum."""
        url_lower = url.lower()
        if any(d in url_lower for d in ["kompas.com", "detik.com", "cnnindonesia.com", "liputan6.com", "tempo.co"]):
            return SourceType.NEWS
        if any(d in url_lower for d in ["medium.com", "blogspot.com", "wordpress.com", "substack.com"]):
            return SourceType.BLOG
        return SourceType.ARTICLE

    @staticmethod
    def _detect_lang(text: str) -> str:
        """Simple language detection."""
        if not text:
            return "id"
        id_words = {"yang", "dan", "di", "untuk", "dengan", "adalah", "ini", "itu", "dari", "pada"}
        words = set(text.lower().split()[:100])
        if words & id_words:
            return "id"
        return "en"

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[str]:
        """Parse various date formats to ISO string."""
        if not date_str:
            return None
        # Tavily returns ISO format already
        return date_str


# ---- Mock for testing ----
class MockWebSearchModule:
    """Deterministic mock returning fixture-like news/blog items."""

    name = "tavily_web_search_mock"

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
                source_type=SourceType.NEWS,
                source_name="tavily_mock",
                url="https://kompas.com/bisnis/kopi-indonesia-2024",
                title="Industri Kopi Indonesia Tumbuh 15% di 2024",
                raw_text=(
                    "JAKARTA - Industri kopi Indonesia menunjukkan pertumbuhan signifikan "
                    "sebesar 15% sepanjang tahun 2024. Data dari Asosiasi Eksportir Kopi "
                    "Indonesia (AEKI) menunjukkan ekspor kopi mencapai 450 ribu ton. "
                    "Tren kopi spesialti dan kedai kopi modern menjadi pendorong utama. "
                    f"Di {loc.city}, jumlah kedai kopi baru bertambah 30% dibanding 2023."
                ),
                lang_hint="id",
                published_at="2024-11-15T08:00:00+00:00",
                geo_hint=loc,
                raw_meta={"score": 0.92},
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.BLOG,
                source_name="tavily_mock",
                url="https://medium.com/kopi-nusantara/tren-kopi-2024",
                title="Tren Kopi 2024: Manual Brew vs Espresso",
                raw_text=(
                    "Konsumen Indonesia semakin kritis soal kualitas kopi. Manual brew "
                    "(V60, Kalita, Aeropress) tumbuh 40% YoY. Kedai yang hanya andalkan "
                    "mesin espresso mulai kehilangan segmen menengah ke atas. "
                    f"Observasi di {loc.city} menunjukkan 60% kedai baru menawarkan manual brew."
                ),
                lang_hint="id",
                published_at="2024-10-20T10:00:00+00:00",
                geo_hint=loc,
                raw_meta={"score": 0.78},
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.ARTICLE,
                source_name="tavily_mock",
                url="https://databoks.katadata.co.id/kopi-konsumsi",
                title="Konsumsi Kopi Per Kapita Indonesia Masih Rendah",
                raw_text=(
                    "Menurut data BPS, konsumsi kopi per kapita Indonesia baru 1,2 kg/tahun, "
                    "jauh di bawah Finlandia (12 kg) atau Brasil (6 kg). Ini menandakan "
                    "ruang pertumbuhan besar bagi industri kopi domestik. "
                    f"Provinsi {loc.province or 'Jawa Barat'} menyumbang 25% konsumsi nasional."
                ),
                lang_hint="id",
                published_at="2024-09-10T06:00:00+00:00",
                geo_hint=loc,
                raw_meta={"score": 0.85},
            ),
        ]
        logger.info("MockWebSearchModule: returned %d items for scope %s", len(items), scope.scope_id)
        return items