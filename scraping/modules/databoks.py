"""Databoks (databoks.katadata.co.id) module for curated Indonesian market datasets.

Outputs RawDataItem with source_type=DATABOKS.
"""

from __future__ import annotations

import logging
import os
import re
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

DATABOKS_API = "https://databoks.katadata.co.id/api/v1"
DATABOKS_SEARCH = f"{DATABOKS_API}/search"
DATABOKS_DATASET = f"{DATABOKS_API}/dataset"


class DataboksModule:
    """Databoks API client for curated Indonesian market datasets.

    Databoks provides pre-cleaned datasets from BPS, Bank Indonesia, Ministries, etc.
    """

    name = "databoks"

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.api_key = api_key or os.getenv("DATABOKS_API_KEY")
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
        return self._healthy

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        """Search and fetch relevant Databoks datasets."""
        if not self.api_key:
            logger.warning("DATABOKS_API_KEY not set, skipping Databoks module")
            self._healthy = False
            return []

        items: list[RawDataItem] = []
        inp = scope.business_input
        loc = inp.location

        # Search for relevant datasets
        queries = self._build_search_queries(inp, loc)

        for query in queries:
            try:
                datasets = await self._search_datasets(query)
                for ds in datasets[:3]:  # Top 3 per query
                    data = await self._fetch_dataset(ds["id"])
                    if data:
                        items.append(self._make_item(scope, ds, data, loc))
            except Exception as e:  # noqa: BLE001
                logger.warning("Databoks search failed for '%s': %s", query, e)

        logger.info("Databoks module: returned %d items for scope %s", len(items), scope.scope_id)
        return items

    def _build_search_queries(self, inp, loc) -> list[str]:
        """Build search queries based on business context."""
        queries = [
            inp.business_type,
            f"{inp.business_type} {loc.province or 'Indonesia'}",
        ]

        category_queries = {
            "food_beverage": ["kopi", "kuliner", "makanan minuman", "rumah makan", "kafe"],
            "retail": ["ritel", "toko kelontong", "minimarket", "supermarket"],
            "fashion": ["fashion", "pakaian", "tekstil", "busana"],
            "beauty": ["kecantikan", "salon", "skincare", "kosmetik"],
            "services": ["jasa", "usaha jasa", "jasa profesional"],
            "health": ["kesehatan", "klinik", "rumah sakit", "apotek"],
            "education": ["pendidikan", "bimbel", "kursus", "sekolah"],
            "tech_digital": ["teknologi", "digital", "startup", "e-commerce"],
        }

        queries.extend(category_queries.get(inp.category.value, []))
        return list(dict.fromkeys(queries))  # dedupe preserving order

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _search_datasets(self, query: str) -> list[dict]:
        """Search Databoks for relevant datasets."""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {"q": query, "limit": 10}

        resp = await self.client.get(DATABOKS_SEARCH, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

        return data.get("data", [])

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _fetch_dataset(self, dataset_id: str) -> Optional[dict]:
        """Fetch full dataset by ID."""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        resp = await self.client.get(f"{DATABOKS_DATASET}/{dataset_id}", headers=headers)
        resp.raise_for_status()
        return resp.json().get("data")

    def _make_item(self, scope: ScopeConfig, dataset: dict, data: dict, loc) -> RawDataItem:
        """Convert Databoks dataset to RawDataItem."""
        title = dataset.get("title", "Databoks Dataset")
        description = dataset.get("description", "")
        source = dataset.get("source", "Databoks")
        period = dataset.get("period", "")
        unit = dataset.get("unit", "")

        # Extract key metrics from dataset
        metrics = data.get("data", [])
        summary_parts = []
        for m in metrics[:5]:
            label = m.get("label", m.get("name", ""))
            value = m.get("value", m.get("nilai", ""))
            if label and value:
                summary_parts.append(f"{label}: {value} {unit}")

        raw_text = f"{title}. {description} " + "; ".join(summary_parts) if summary_parts else f"{title}. {description}"

        return RawDataItem(
            scope_id=scope.scope_id,
            source_type=SourceType.DATABOKS,
            source_name="databoks.katadata.co.id",
            url=f"https://databoks.katadata.co.id/dataset/{dataset.get('slug', dataset.get('id', ''))}",
            title=title,
            raw_text=raw_text,
            lang_hint="id",
            published_at=self._parse_period(period),
            geo_hint=loc,
            raw_meta={
                "dataset_id": dataset.get("id"),
                "source": source,
                "period": period,
                "unit": unit,
                "metrics_count": len(metrics),
            },
        )

    @staticmethod
    def _parse_period(period: str) -> Optional[str]:
        """Parse period string to ISO date."""
        if not period:
            return None
        # Try to extract year
        match = re.search(r"(\d{4})", period)
        if match:
            return f"{match.group(1)}-01-01T00:00:00+00:00"
        return None


# ---- Mock ----
class MockDataboksModule:
    name = "databoks_mock"

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
                source_type=SourceType.DATABOKS,
                source_name="databoks_mock",
                url="https://databoks.katadata.co.id/dataset/ekspor-kopi-indonesia",
                title="Ekspor Kopi Indonesia 2020-2024",
                raw_text=(
                    "Ekspor kopi Indonesia tahun 2024: 450 ribu ton (nilai USD 1,2 M). "
                    "Tujuan utama: AS (25%), Italia (15%), Jerman (12%), Jepang (10%). "
                    "Kopi robusta menyumbang 80% volume. Tren ekspor kopi spesialti naik 35% YoY. "
                    f"Provinsi {loc.province or 'Sumatera'} tetap pengekspor terbesar (60% volume)."
                ),
                lang_hint="id",
                published_at="2024-12-01T00:00:00+00:00",
                geo_hint=loc,
                raw_meta={
                    "dataset_id": "ekspor-kopi-indonesia",
                    "source": "BPS / Dirjen Perdagangan",
                    "period": "2024",
                    "unit": "ton / USD",
                    "key_metrics": [
                        {"label": "Volume ekspor", "value": "450000", "unit": "ton"},
                        {"label": "Nilai ekspor", "value": "1200000000", "unit": "USD"},
                        {"label": "Robusta share", "value": "80", "unit": "%"},
                        {"label": "Specialty growth YoY", "value": "35", "unit": "%"},
                    ],
                },
            ),
            RawDataItem(
                scope_id=scope.scope_id,
                source_type=SourceType.DATABOKS,
                source_name="databoks_mock",
                url="https://databoks.katadata.co.id/dataset/pengeluaran-konsumen",
                title="Pola Pengeluaran Konsumen Urban 2024",
                raw_text=(
                    "Survei pengeluaran rumah tangga urban 2024: rata-rata Rp 5,2 juta/bulan. "
                    "Alokasi: makanan-minuman 38%, transport 18%, perumahan 15%, "
                    "pendidikan 9%, kesehatan 6%, hiburan 5%, lainnya 9%. "
                    "Segmen menengah ke atas (Rp 10-20jt/bln) alokasi makanan-minuman turun ke 30%, "
                    "hiburan naik ke 12%. Implikasi: kopi spesialti target pasar menengah atas."
                ),
                lang_hint="id",
                published_at="2024-11-15T00:00:00+00:00",
                geo_hint=loc,
                raw_meta={
                    "dataset_id": "pengeluaran-konsumen-urban",
                    "source": "BPS Susenas / Katadata Insight",
                    "period": "2024",
                    "unit": "Rp/bulan",
                    "key_metrics": [
                        {"label": "Total pengeluaran", "value": "5200000", "unit": "Rp"},
                        {"label": "Makanan-minuman share", "value": "38", "unit": "%"},
                        {"label": "Upper middle makanan share", "value": "30", "unit": "%"},
                        {"label": "Upper middle hiburan share", "value": "12", "unit": "%"},
                    ],
                },
            ),
        ]
        logger.info("MockDataboksModule: returned %d items", len(items))
        return items