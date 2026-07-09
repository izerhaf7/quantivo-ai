"""
BOA SaaS — INTERFACE CONTRACTS (tanda tangan fungsi antar-domain)

Ini melengkapi contracts.py: contracts.py = bentuk DATA,
interfaces.py = bentuk FUNGSI. Tiap orang implement Protocol miliknya.
Selama signature-nya dipatuhi, orang lain bisa pakai versi MOCK dulu.

Cara pakai:
  - Faiz  implement ScraperModule (satu class per sumber).
  - Izerhaf implement DataRouter + keempat Agent Protocol + Retriever.
  - Razan  memanggil semuanya lewat Protocol ini (bukan implementasi konkret),
           jadi bisa mulai dgn MockScraper/MockAgent lalu tukar belakangan.
"""
from __future__ import annotations

from typing import Protocol, runtime_checkable

from contracts import (
    ScopeConfig, BusinessInput, RawDataItem, RoutedDataItem, RouterConfig,
    Chunk, RetrievedChunk, AnalysisTrack, RerankRequest, RerankResponse,
    SentimentResult, SWOTResult, SummaryRequest, Report,
)


# ---------------------------------------------------------------------------
# FAIZ — SCRAPING
# ---------------------------------------------------------------------------
@runtime_checkable
class ScraperModule(Protocol):
    """
    Satu class per sumber (WebSearchModule, TrendsModule, PlacesModule,
    BpsModule, dst). Wajib async + circuit-breaker internal: kalau sumber
    gagal/limit -> kembalikan list kosong + log, JANGAN raise ke atas
    (graceful degradation, Bagian 3 spesifikasi).
    """
    name: str

    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]: ...

    def is_healthy(self) -> bool: ...   # untuk laporan degradasi di Report


# ---------------------------------------------------------------------------
# IZERHAF — ROUTER (metrik penentu track)
# ---------------------------------------------------------------------------
@runtime_checkable
class DataRouter(Protocol):
    """
    Menerima RawDataItem mentah, mengeluarkan keputusan track.
    v1 hackathon: rule-based (source_type prior) + embedding-similarity
    (relevance) + rules geo/recency/lang/dedup. Deterministik & explainable.
    """
    async def route(
        self, items: list[RawDataItem], scope: ScopeConfig, config: RouterConfig
    ) -> list[RoutedDataItem]: ...


# ---------------------------------------------------------------------------
# IZERHAF — RAG RETRIEVER
# ---------------------------------------------------------------------------
@runtime_checkable
class Retriever(Protocol):
    async def ingest(self, chunks: list[Chunk]) -> int: ...          # -> jumlah ter-index

    async def retrieve(
        self, query: str, scope: ScopeConfig, track: AnalysisTrack, top_k: int = 30
    ) -> list[RetrievedChunk]: ...                                   # hybrid dense+sparse


# ---------------------------------------------------------------------------
# IZERHAF — AGENTS
# ---------------------------------------------------------------------------
@runtime_checkable
class RerankAgent(Protocol):
    async def rerank(self, req: RerankRequest) -> RerankResponse: ...


@runtime_checkable
class SentimentAgent(Protocol):
    async def analyze(
        self, scope: ScopeConfig, chunks: list[RetrievedChunk]
    ) -> SentimentResult: ...


@runtime_checkable
class SwotAgent(Protocol):
    async def analyze(
        self, scope: ScopeConfig, chunks: list[RetrievedChunk]
    ) -> SWOTResult: ...


@runtime_checkable
class SummaryAgent(Protocol):
    async def compose(self, req: SummaryRequest) -> Report: ...


# ---------------------------------------------------------------------------
# RAZAN — ORCHESTRATOR (dia yang merangkai semua di atas)
# ---------------------------------------------------------------------------
@runtime_checkable
class Orchestrator(Protocol):
    async def create_scope(self, inp: BusinessInput) -> ScopeConfig: ...   # Tahap 0
    async def run(self, scope: ScopeConfig) -> Report: ...                 # Tahap 1-5
