"""
BOA SaaS — SHARED CONTRACTS (Single Source of Truth)
AMD Developer Hackathon: ACT II — Track Unicorn

============================================================================
ATURAN MAIN (baca sebelum ngoding):
  1. Ini SATU-SATUNYA sumber kebenaran untuk bentuk data antar-domain.
  2. FREEZE file ini di Jam-0. Semua orang import dari sini.
  3. Mau ubah field? -> umumkan di channel tim + naikkan CONTRACT_VERSION.
     Jangan diam-diam ubah, karena ini yang mengunci integrasi 4 orang.
  4. Frontend meng-generate tipe TS dari OpenAPI (yang di-generate FastAPI
     dari model-model ini), jadi field di sini = field di frontend.

Peta kepemilikan seam:
  Faiz (Scraping)  --RawDataItem-->  Router  --RoutedDataItem-->  Preprocess
  Backend (Razan)  memiliki: ScopeConfig, orchestration, Report, API
  AI/ML (Izerhaf)  memiliki: Router logic, Chunk, *Result, agents
  Frontend (Indra) mengkonsumsi: BusinessInput, AnalysisStatusResponse, Report
============================================================================
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

CONTRACT_VERSION = "1.0.0"


def _uid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ===========================================================================
# ENUMS
# ===========================================================================
class IndustryCategory(str, Enum):
    FOOD_BEVERAGE = "food_beverage"      # kedai kopi, warung, resto
    RETAIL = "retail"                    # toko kelontong, minimarket
    FASHION = "fashion"
    BEAUTY = "beauty"                    # salon, barbershop, skincare
    SERVICES = "services"                # laundry, bengkel, jasa
    HEALTH = "health"                    # klinik, apotek
    EDUCATION = "education"              # bimbel, kursus
    TECH_DIGITAL = "tech_digital"
    AGRICULTURE = "agriculture"
    OTHER = "other"


class SourceType(str, Enum):
    """Diisi oleh scraper. Menjadi prior utama untuk routing track."""
    NEWS = "news"
    BLOG = "blog"
    ARTICLE = "article"
    REVIEW = "review"                    # ulasan (mis. dari Places) -> sentiment
    FORUM = "forum"                      # kaskus, reddit, dsb -> sentiment
    SOCIAL = "social"                    # dicadangkan (tidak dipakai MVP)
    PLACES_LISTING = "places_listing"    # kompetitor dari Places -> swot
    TRENDS = "trends"                    # Google Trends -> market
    BPS_STAT = "bps_stat"                # statistik BPS -> market
    DATABOKS = "databoks"                # -> market


class AnalysisTrack(str, Enum):
    """Ke mana sebuah item mengalir SETELAH routing, SEBELUM preprocessing."""
    SENTIMENT = "sentiment"
    SWOT = "swot"
    MARKET = "market"
    DISCARD = "discard"                  # gagal gate relevansi/kualitas


class AnalysisStatus(str, Enum):
    """Status job. Frontend polling nilai ini untuk progress UI."""
    AWAITING_CONFIRMATION = "awaiting_confirmation"  # Tahap 0 checkpoint
    CONFIRMED = "confirmed"
    SCRAPING = "scraping"
    ROUTING = "routing"
    PREPROCESSING = "preprocessing"
    INDEXING = "indexing"
    ANALYZING = "analyzing"
    COMPOSING = "composing"
    COMPLETED = "completed"
    PARTIAL = "partial"                  # graceful degradation: laporan parsial
    FAILED = "failed"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class BusinessStage(str, Enum):
    """Menentukan FRAMING seluruh rekomendasi (validasi ide != optimasi existing)."""
    IDEA = "idea"                # baru ide, belum jalan
    NEW = "new"                  # baru buka (<1 tahun)
    ESTABLISHED = "established"  # sudah berjalan
    EXPANDING = "expanding"      # ekspansi / pindah / buka cabang


class PrimaryGoal(str, Enum):
    """Tujuan laporan. Memberi tahu Summary Agent section mana yang ditekankan."""
    VALIDATE_IDEA = "validate_idea"
    ASSESS_LOCATION = "assess_location"
    KNOW_COMPETITORS = "know_competitors"
    FIND_PRODUCT_GAP = "find_product_gap"
    MEASURE_DEMAND = "measure_demand"


class TargetCustomer(str, Enum):
    """Menajamkan sentimen SIAPA yang dihitung + kuadran SWOT."""
    STUDENTS = "students"
    OFFICE_WORKERS = "office_workers"
    FACTORY_WORKERS = "factory_workers"
    FAMILIES = "families"
    YOUTH = "youth"
    TOURISTS = "tourists"
    GENERAL = "general"


class BudgetRange(str, Enum):
    """Opsional. Membuat rekomendasi realistis (feasibility)."""
    UNDER_10M = "under_10m"      # < Rp 10 juta
    R10_50M = "10m_50m"
    R50_200M = "50m_200m"
    OVER_200M = "over_200m"
    UNDISCLOSED = "undisclosed"


# ===========================================================================
# GEO PRIMITIVES
# ===========================================================================
class GeoPoint(BaseModel):
    lat: float
    lng: float


class Location(BaseModel):
    city: str
    district: Optional[str] = None
    province: Optional[str] = None
    coordinates: Optional[GeoPoint] = None


# ===========================================================================
# TAHAP 0 — INPUT & SCOPE  (Frontend -> Backend -> semua agent)
# ===========================================================================
class BusinessInput(BaseModel):
    """
    Yang dikirim form frontend. Ini kontrak Indra <-> Razan untuk input,
    sekaligus SUMBER KONTEKS untuk seluruh pipeline (scraping -> LLM).

    3 tingkat (lihat RENCANA-TEKNIS-BOA.md §2):
      - Tingkat 1 (wajib): tanpa ini, ada tahap yang menebak buta.
      - Tingkat 2 (disarankan): mengubah laporan generik jadi pendukung keputusan.
      - Tingkat 3 (opsional): bonus akurasi; taruh di panel "tambah konteks".
    """
    # --- Tingkat 1: WAJIB ---
    business_type: str = Field(..., examples=["Kedai kopi specialty"])
    description: str = Field(..., examples=["Kopi manual brew + ruang kerja"])
    location: Location
    category: IndustryCategory
    radius_km: float = Field(3.0, ge=0.5, le=25)
    business_stage: BusinessStage

    # --- Tingkat 2: SANGAT DISARANKAN ---
    primary_goals: list[PrimaryGoal] = Field(
        default_factory=list,
        description="Minimal 1 sangat dianjurkan; menyetir fokus laporan.")
    target_customers: list[TargetCustomer] = Field(default_factory=list)

    # --- Tingkat 3: OPSIONAL ---
    known_competitors: list[str] = Field(
        default_factory=list, description="Seed SWOT + verifikasi hasil Places.")
    unique_value: Optional[str] = Field(
        None, examples=["Satu-satunya yang buka 24 jam di area ini"])
    budget_range: Optional[BudgetRange] = None
    business_name: Optional[str] = Field(
        None, description="Personalisasi laporan saja; tidak dipakai scraping.")


class ScopeConfig(BaseModel):
    """
    Hasil Tahap 0. Dikembalikan ke frontend untuk CHECKPOINT KONFIRMASI,
    lalu jadi parameter semua modul berikutnya.
    """
    scope_id: str = Field(default_factory=_uid)
    business_input: BusinessInput
    interpreted_summary: str = Field(
        ...,
        description="Teks yang ditampilkan ke user untuk dikonfirmasi.",
        examples=["Kami akan menganalisis kompetitor kedai kopi dalam radius "
                  "3km dari Cikarang, plus sentimen area sekitarnya."],
    )
    search_keywords: list[str] = Field(default_factory=list)
    competitor_query: str = Field(..., examples=["kedai kopi Cikarang"])
    created_at: datetime = Field(default_factory=_now)
    expires_at: datetime  # TTL buffer data mentah (Bagian 3 & 5.3 spesifikasi)


# ===========================================================================
# TAHAP 1 — SCRAPING  (Faiz -> Router)
# ===========================================================================
class RawDataItem(BaseModel):
    """
    SATU-SATUNYA output yang perlu diproduksi Faiz. Dia TIDAK perlu tahu
    soal track/preprocessing. Isi field sebanyak yang tersedia dari sumber.

    Catatan TOS Places: HANYA place_id yang boleh dipersistensi permanen.
    raw_text ulasan Places wajib kena TTL buffer, bukan DB permanen.
    """
    item_id: str = Field(default_factory=_uid)
    scope_id: str
    source_type: SourceType
    source_name: str = Field(..., examples=["kompas.com", "google_places"])
    url: Optional[str] = None
    title: Optional[str] = None
    raw_text: str
    lang_hint: Optional[str] = None                 # "id" | "en" | None
    published_at: Optional[datetime] = None
    geo_hint: Optional[Location] = None

    # Khusus item Places (kompetitor). place_id = satu-satunya konten persist-able.
    place_id: Optional[str] = None
    rating_aggregate: Optional[float] = None        # agregat, BUKAN quote ulasan
    review_count: Optional[int] = None

    scraped_at: datetime = Field(default_factory=_now)
    raw_meta: dict = Field(default_factory=dict)    # bebas, per-modul


# ===========================================================================
# METRIK ROUTING  <-- "metrik yang menentukan data masuk ke mana"
# (antara Scraping dan Preprocessing). Deterministik & explainable.
# ===========================================================================
class GeoMatch(str, Enum):
    EXACT = "exact"     # kecamatan cocok
    CITY = "city"       # kota cocok
    REGION = "region"   # provinsi cocok
    NONE = "none"


class RoutingScore(BaseModel):
    """Semua komponen metrik. Semua kuantitatif -> dipakai lagi di confidence."""
    relevance_score: float = Field(..., ge=0, le=1,
        description="Cosine sim embedding(item) vs embedding(scope intent).")
    geo_match: GeoMatch
    recency_score: float = Field(..., ge=0, le=1,
        description="Decay eksponensial dari published_at (half-life di config).")
    lang_ok: bool
    is_duplicate: bool
    quality_score: float = Field(..., ge=0, le=1,
        description="Komposit akhir; dipakai sebagai bobot di preprocessing.")


class RoutingDecision(BaseModel):
    item_id: str
    tracks: list[AnalysisTrack]     # multi-label. [DISCARD] => dibuang.
    score: RoutingScore
    reason: str = Field(..., examples=["off_topic (relevance 0.21 < 0.35)",
                                       "review+geo:city -> sentiment"])
    kept: bool


class RoutedDataItem(BaseModel):
    """Output Router. Item + keputusannya. Yang kept=True lanjut preprocessing."""
    raw: RawDataItem
    decision: RoutingDecision


class RouterConfig(BaseModel):
    """Threshold di-tuning tim AI/ML. Eksplisit supaya bukan black box saat demo."""
    tau_discard: float = 0.35          # relevance < ini -> discard
    tau_foreign_lang_keep: float = 0.55  # bahasa asing hanya dipertahankan jika sangat relevan
    recency_halflife_days: float = 180.0
    dup_similarity_threshold: float = 0.92
    # bobot komposit quality_score
    w_relevance: float = 0.5
    w_geo: float = 0.3
    w_recency: float = 0.2


# ===========================================================================
# TAHAP 3 — RAG CHUNK & RETRIEVAL  (internal AI/ML, tapi dikontrakkan)
# ===========================================================================
class Chunk(BaseModel):
    chunk_id: str = Field(default_factory=_uid)
    scope_id: str
    source_item_id: str
    track: AnalysisTrack            # chunk mewarisi track dari item induk
    text: str
    source_type: SourceType
    source_name: str
    geo_tag: Optional[Location] = None
    published_at: Optional[datetime] = None
    relevance_score: float          # diwarisi dari routing
    recency_score: float            # diwarisi dari routing


class RetrievedChunk(BaseModel):
    chunk: Chunk
    dense_score: float
    sparse_score: Optional[float] = None   # dari BGE-M3 sparse / BM25
    rerank_score: Optional[float] = None   # diisi setelah Rerank Agent


class RerankRequest(BaseModel):
    scope: ScopeConfig
    track: AnalysisTrack
    candidates: list[RetrievedChunk]
    top_k: int = 15


class RerankResponse(BaseModel):
    track: AnalysisTrack
    ranked: list[RetrievedChunk]   # sudah terurut + rerank_score terisi


# ===========================================================================
# TAHAP 4 — AGENT OUTPUTS  (Izerhaf -> Razan)
# ===========================================================================
class SectionConfidence(BaseModel):
    """
    Confidence PER-SECTION dari basis KUANTITATIF (Bagian 8.2 spesifikasi).
    DILARANG angka subjektif hasil generate LLM tanpa dasar.
    """
    score: float = Field(..., ge=0, le=1)
    source_count: int
    agreement: float = Field(..., ge=0, le=1,
        description="Tingkat kesepakatan antar-sumber.")
    recency: float = Field(..., ge=0, le=1)
    explanation: str = Field(..., examples=["12 sumber, mayoritas sepakat"])


class SentimentPoint(BaseModel):
    location_tag: str
    coordinates: Optional[GeoPoint] = None   # untuk heatmap
    sentiment_score: float = Field(..., ge=-1, le=1)
    label: Sentiment
    sample_size: int
    demographics: Optional[dict] = Field(
        None,
        description="HANYA jika sumber menyediakan sinyalnya. "
                    "Dilarang di-generate/diasumsikan. Kalau tidak ada -> None.")


class SentimentResult(BaseModel):
    scope_id: str
    points: list[SentimentPoint]
    overall_distribution: dict = Field(
        ..., examples=[{"positive": 0.62, "neutral": 0.23, "negative": 0.15}])
    sources: list[str]              # nama sumber saja, bukan konten mentah
    confidence: SectionConfidence


class Competitor(BaseModel):
    name: str
    category: str
    rating_aggregate: Optional[float] = None
    review_count: Optional[int] = None
    place_id: Optional[str] = None   # boleh persist
    coordinates: Optional[GeoPoint] = None


class SWOTResult(BaseModel):
    scope_id: str
    strengths: list[str]
    weaknesses: list[str]
    opportunities: list[str]
    threats: list[str]
    competitors: list[Competitor]
    confidence: SectionConfidence


class SummaryRequest(BaseModel):
    scope: ScopeConfig
    sentiment: Optional[SentimentResult] = None   # bisa None (degradasi)
    swot: Optional[SWOTResult] = None
    market_notes: list[str] = Field(default_factory=list)


# ===========================================================================
# TAHAP 5 — REPORT  (Razan -> Indra)
# ===========================================================================
class Visualizations(BaseModel):
    heatmap_geojson_url: Optional[str] = None   # frontend render pakai MapLibre
    sentiment_chart_data: Optional[dict] = None
    competitor_table: list[Competitor] = Field(default_factory=list)


class Report(BaseModel):
    scope_id: str
    status: AnalysisStatus
    executive_summary: str
    sentiment: Optional[SentimentResult] = None
    swot: Optional[SWOTResult] = None
    market_insights: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    narrative: str = ""
    visualizations: Visualizations = Field(default_factory=Visualizations)
    degradation_notes: list[str] = Field(
        default_factory=list,
        description="Disclosure jujur saat 1+ sumber gagal (graceful degradation).")
    generated_at: datetime = Field(default_factory=_now)


# ===========================================================================
# API RESPONSE MODELS  (Frontend <-> Backend, dipakai FastAPI -> OpenAPI -> TS)
# ===========================================================================
class CreateAnalysisResponse(BaseModel):
    """Balasan POST /api/analyses (sebelum konfirmasi)."""
    analysis_id: str
    status: AnalysisStatus              # = AWAITING_CONFIRMATION
    scope: ScopeConfig                  # tampilkan interpreted_summary utk konfirmasi


class ProgressStage(BaseModel):
    status: AnalysisStatus
    pct: int = Field(..., ge=0, le=100)
    message: str


class AnalysisStatusResponse(BaseModel):
    """Balasan GET /api/analyses/{id} (dipolling frontend)."""
    analysis_id: str
    status: AnalysisStatus
    progress: ProgressStage
    sections_ready: list[str] = Field(
        default_factory=list, examples=[["sentiment", "swot"]])
    error: Optional[str] = None


# Kumpulan tipe yang diekspor eksplisit (biar rapi saat generate schema).
__all__ = [
    "CONTRACT_VERSION",
    "IndustryCategory", "SourceType", "AnalysisTrack", "AnalysisStatus", "Sentiment",
    "BusinessStage", "PrimaryGoal", "TargetCustomer", "BudgetRange",
    "GeoPoint", "Location", "BusinessInput", "ScopeConfig",
    "RawDataItem", "GeoMatch", "RoutingScore", "RoutingDecision",
    "RoutedDataItem", "RouterConfig",
    "Chunk", "RetrievedChunk", "RerankRequest", "RerankResponse",
    "SectionConfidence", "SentimentPoint", "SentimentResult",
    "Competitor", "SWOTResult", "SummaryRequest",
    "Visualizations", "Report",
    "CreateAnalysisResponse", "ProgressStage", "AnalysisStatusResponse",
]