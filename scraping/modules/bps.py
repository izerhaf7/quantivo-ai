"""BPS (Badan Pusat Statistik) WebAPI module.

Fetches official Indonesian statistics for market analysis.
Outputs RawDataItem with source_type=BPS_STAT.

API docs: https://webapi.bps.go.id/
Requires API key from BPS (register at https://webapi.bps.go.id/register)
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
    Location,
    IndustryCategory,
)

logger = logging.getLogger(__name__)

BPS_BASE = "https://webapi.bps.go.id/v1"


class BpsModule:
    """BPS WebAPI client for Indonesian statistical data.

    Available datasets (partial):
    - Susenas (Survei Sosial Ekonomi Nasional) - konsumsi, pengeluaran
    - SP2020 (Sensus Penduduk) - demografi
    - Badan Usaha - jumlah usaha per sektor
    - Harga Konsumen - IHK, inflasi
    - Produksi Pertanian - kopi, teh, dll
    """

    name = "bps_statistics"

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ):
        self.api_key = api_key or os.getenv("BPS_API_KEY")
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
        """Fetch BPS statistics relevant to the business scope."""
        if not self.api_key:
            logger.warning("BPS_API_KEY not set; BpsModule returning empty")
            self._healthy = False
            return []

        items: list[RawDataItem] = []
        inp = scope.business_input
        loc = inp.location

        # Determine relevant dataset based on category
        dataset_map = {
            "food_beverage": ["susenas_konsumsi", "produksi_kopi"],
            "retail": ["susenas_pengeluaran", "badan_usaha_ritel"],
            "fashion": ["badan_usaha_fashion", "susenas_pengeluaran"],
            "beauty": ["badan_usaha_jasa", "susenas_pengeluaran"],
            "services": ["badan_usaha_jasa", "susenas_pengeluaran"],
            "health": ["susenas_kesehatan", "badan_usaha_kesehatan"],
            "education": ["susenas_pendidikan", "badan_usaha_pendidikan"],
        }

        datasets = dataset_map.get(inp.category.value, ["susenas_pengeluaran", "badan_usaha"])

        for dataset in datasets[:2]:  # Cap at 2 datasets
            try:
                data = await self._fetch_dataset(dataset, loc, inp.category)
                if data:
                    items.append(self._make_item(scope, dataset, data, loc))
            except Exception as e:  # noqa: BLE001
                logger.warning("BPS fetch failed for dataset '%s': %s", dataset, e)

        logger.info("BpsModule: returned %d items for scope %s", len(items), scope.scope_id)
        return items

    @retry(
        wait=wait_exponential_jitter(initial=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.RequestError),
        reraise=True,
    )
    async def _fetch_dataset(self, dataset: str, loc: Location, category: "IndustryCategory | None" = None) -> Optional[dict]:
        """Fetch a specific BPS dataset with geographic filtering."""
        # BPS API uses different endpoints per dataset
        # This is a simplified implementation - actual API needs dataset-specific params

        if dataset == "susenas_konsumsi":
            return await self._fetch_susenas_konsumsi(loc)
        elif dataset == "susenas_pengeluaran":
            return await self._fetch_susenas_pengeluaran(loc)
        elif dataset == "produksi_kopi":
            return await self._fetch_produksi_kopi(loc)
        elif dataset == "badan_usaha":
            return await self._fetch_badan_usaha(loc, category)
        else:
            # Generic fallback
            return await self._fetch_generic(dataset, loc)

    async def _fetch_susenas_konsumsi(self, loc: Location) -> Optional[dict]:
        """Fetch Susenas konsumsi makanan-minuman per kapita."""
        params = {
            "key": self.api_key,
            "model": "susenas",
            "var": "konsumsi_makanan_minuman",
            "wilayah": self._get_wilayah_code(loc),
            "tahun": "2023",  # Latest available
        }

        resp = await self.client.get(f"{BPS_BASE}/data", params=params)
        resp.raise_for_status()
        return resp.json()

    async def _fetch_susenas_pengeluaran(self, loc: Location) -> Optional[dict]:
        """Fetch Susenas pengeluaran per kapita."""
        params = {
            "key": self.api_key,
            "model": "susenas",
            "var": "pengeluaran_per_kapita",
            "wilayah": self._get_wilayah_code(loc),
            "tahun": "2023",
        }

        resp = await self.client.get(f"{BPS_BASE}/data", params=params)
        resp.raise_for_status()
        return resp.json()

    async def _fetch_produksi_kopi(self, loc: Location) -> Optional[dict]:
        """Fetch kopi production statistics."""
        params = {
            "key": self.api_key,
            "model": "pertanian",
            "var": "produksi_kopi",
            "wilayah": self._get_wilayah_code(loc),
            "tahun": "2023",
        }

        resp = await self.client.get(f"{BPS_BASE}/data", params=params)
        resp.raise_for_status()
        return resp.json()

    async def _fetch_badan_usaha(self, loc: Location, category: "IndustryCategory | None" = None) -> Optional[dict]:
        """Fetch number of businesses by sector."""
        params = {
            "key": self.api_key,
            "model": "badan_usaha",
            "var": "jumlah_badan_usaha",
            "wilayah": self._get_wilayah_code(loc),
            "tahun": "2023",
            "sektor": self._get_sektor_code(category),
        }

        resp = await self.client.get(f"{BPS_BASE}/data", params=params)
        resp.raise_for_status()
        return resp.json()

    async def _fetch_generic(self, dataset: str, loc: Location) -> Optional[dict]:
        """Generic dataset fetch."""
        params = {
            "key": self.api_key,
            "model": dataset,
            "wilayah": self._get_wilayah_code(loc),
            "tahun": "2023",
        }

        resp = await self.client.get(f"{BPS_BASE}/data", params=params)
        resp.raise_for_status()
        return resp.json()

    def _get_wilayah_code(self, loc: Location) -> str:
        """Map location to BPS wilayah code (kode BPS)."""
        # Simplified mapping - real implementation needs full BPS kode wilayah table
        kode_map = {
            ("DKI Jakarta", None): "31",
            ("Jawa Barat", None): "32",
            ("Jawa Tengah", None): "33",
            ("Jawa Timur", None): "35",
            ("Banten", None): "36",
            ("Bali", None): "51",
            ("Sumatera Utara", None): "12",
            ("Sumatera Barat", None): "13",
            ("Riau", None): "14",
            ("Jambi", None): "15",
            ("Sumatera Selatan", None): "16",
            ("Bengkulu", None): "17",
            ("Lampung", None): "18",
            ("Kepulauan Bangka Belitung", None): "19",
            ("Kepulauan Riau", None): "21",
            ("DI Yogyakarta", None): "34",
        }

        # Try exact province match
        key = (loc.province, None)
        if key in kode_map:
            return kode_map[key]

        # Try city-level (would need more detailed mapping)
        return "00"  # National level fallback

    def _get_sektor_code(self, category: "IndustryCategory | None" = None) -> str:
        """Map IndustryCategory to BPS sector code (KBLI)."""
        sector_map = {
            "food_beverage": "56",  # Jasa Makanan dan Minuman
            "retail": "47",         # Perdagangan Eceran
            "fashion": "14",        # Pakaian
            "beauty": "96",         # Jasa Kecantikan
            "services": "96",       # Jasa Lainnya
            "health": "86",         # Kesehatan
            "education": "85",      # Pendidikan
        }
        if category is None:
            return "96"
        return sector_map.get(category.value, "96")

    def _make_item(self, scope: ScopeConfig, dataset: str, data: dict, loc: Location) -> RawDataItem:
        """Convert BPS response to RawDataItem."""
        # BPS response structure varies; this is a best-effort extraction
        value = data.get("data", {}).get("value") or data.get("value") or data.get("nilai")
        satuan = data.get("satuan") or data.get("unit") or ""
        tahun = data.get("tahun") or "2023"

        label_map = {
            "susenas_konsumsi": "Konsumsi Makanan-Minuman per Kapita",
            "susenas_pengeluaran": "Pengeluaran per Kapita",
            "produksi_kopi": "Produksi Kopi",
            "badan_usaha": "Jumlah Badan Usaha",
        }

        label = label_map.get(dataset, dataset.replace("_", " ").title())

        raw_text = (
            f"Data BPS: {label} di {loc.province or loc.city or 'Indonesia'} "
            f"({tahun}): {value:,.0f} {satuan}."
        )

        return RawDataItem(
            scope_id=scope.scope_id,
            source_type=SourceType.BPS_STAT,
            source_name="bps.go.id",
            url=f"https://webapi.bps.go.id/dataset/{dataset}",
            title=f"BPS: {label} - {loc.province or 'Nasional'}",
            raw_text=raw_text,
            lang_hint="id",
            published_at=f"{tahun}-12-31T00:00:00+00:00",
            geo_hint=loc,
            raw_meta={
                "dataset": dataset,
                "tahun": tahun,
                "value": value,
                "satuan": satuan,
                "wilayah_kode": self._get_wilayah_code(loc),
            },
        )


# ---- Mock ----
class MockBpsModule:
    name = "bps_statistics_mock"

    def __init__(self):
        self._healthy = True

    def is_healthy(self) -> bool:
        return self._healthy

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
        inp = scope.business_input
        loc = inp.location

        # Return different stats based on category
        if inp.category.value == "food_beverage":
            items = [
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.BPS_STAT,
                    source_name="bps_mock",
                    url="https://webapi.bps.go.id/susenas/konsumsi",
                    title="BPS: Pengeluaran Makanan-Minuman per Kapita",
                    raw_text=(
                        f"Susenas 2023: Rata-rata pengeluaran makanan-minuman per kapita "
                        f"di {loc.province or 'Indonesia'} Rp 1.200.000/bulan. "
                        f"Komponen makan luar: 22% (Rp 264rb). "
                        f"Tren naik 5% YoY. {loc.city or 'Area urban'} lebih tinggi 15%."
                    ),
                    lang_hint="id",
                    published_at="2023-12-31T00:00:00+00:00",
                    geo_hint=loc,
                    raw_meta={
                        "dataset": "susenas_konsumsi",
                        "tahun": "2023",
                        "value": 1200000,
                        "satuan": "Rp/kapita/bln",
                        "makan_luar_pct": 22,
                        "trend_yoy": 5,
                    },
                ),
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.BPS_STAT,
                    source_name="bps_mock",
                    url="https://webapi.bps.go.id/pertanian/produksi_kopi",
                    title="BPS: Produksi Kopi Indonesia",
                    raw_text=(
                        f"Produksi kopi Indonesia 2023: 765.000 ton (naik 3% YoY). "
                        f"Robusta 85%, Arabika 15%. "
                        f"Provinsi terbesar: Sumatera Selatan, Lampung, Bengkulu. "
                        f"Ekspor 65% produksi. Harga petani Arabika Rp 45.000/kg."
                    ),
                    lang_hint="id",
                    published_at="2023-12-31T00:00:00+00:00",
                    geo_hint=loc,
                    raw_meta={
                        "dataset": "produksi_kopi",
                        "tahun": "2023",
                        "produksi_total_ton": 765000,
                        "robusta_pct": 85,
                        "arabika_pct": 15,
                        "harga_petani_arabika": 45000,
                    },
                ),
            ]
        else:
            items = [
                RawDataItem(
                    scope_id=scope.scope_id,
                    source_type=SourceType.BPS_STAT,
                    source_name="bps_mock",
                    url="https://webapi.bps.go.id/susenas/pengeluaran",
                    title="BPS: Pengeluaran per Kapita",
                    raw_text=(
                        f"Susenas 2023: Pengeluaran per kapita {loc.province or 'Indonesia'} "
                        f"Rp 3.500.000/bulan. Makanan 45%, Transport 15%, Pendidikan 8%, "
                        f"Kesehatan 6%, Lainnya 26%. Tren naik 6% YoY."
                    ),
                    lang_hint="id",
                    published_at="2023-12-31T00:00:00+00:00",
                    geo_hint=loc,
                    raw_meta={
                        "dataset": "susenas_pengeluaran",
                        "tahun": "2023",
                        "value": 3500000,
                        "satuan": "Rp/kapita/bln",
                        "breakdown": {"makanan": 45, "transport": 15, "pendidikan": 8, "kesehatan": 6, "lainnya": 26},
                    },
                )
            ]

        logger.info("MockBpsModule: returned %d items", len(items))
        return items