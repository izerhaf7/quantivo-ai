"""
backend/orchestrator.py — OrchestratorImpl(interfaces.Orchestrator).

Wires SCRAPING -> ROUTING -> PREPROCESSING -> INDEXING -> ANALYZING ->
COMPOSING to real ml/ implementations via the Protocols in
contracts/interfaces.py, writing progress to JobStore as it goes.

Wiring is REAL by default (real scraper, Fireworks embeddings, Qdrant,
Fireworks LLM small/large split) -- set env USE_MOCKS=true to fall back to
the fully-offline fixture/Mock* pipeline (ml/run_demo.py's wiring), e.g. for
local dev without API keys/services.

Requires the repo root on PYTHONPATH (in addition to contracts/ml) so
`scraping` is importable, e.g.:
  PYTHONPATH="contracts;ml;." uv run uvicorn main:app --app-dir backend --port 8001

Rerank/Sentiment/SWOT/Summary agents are stateless and built once in
__init__. The retriever (and the graph that closes over it) is rebuilt
per run() call: MockRetriever holds per-job chunk state (see mocks.py for
why it must not be shared across concurrent jobs), and QdrantRetriever gets
a fresh per-scope collection so concurrent analyses never share vectors.
"""
from __future__ import annotations

import json
import logging
import os
from datetime import timedelta
from pathlib import Path

from contracts import (
    _now, AnalysisStatus, AnalysisTrack, BusinessInput, Chunk, RawDataItem,
    Report, RouterConfig, ScopeConfig,
)
from agents import (
    HeuristicRerankAgent, SentimentAgentImpl, SummaryAgentImpl, SwotAgentImpl,
)
from chunking import chunks_from_routed
from embeddings import EmbeddingClient, FireworksEmbeddingClient, MockEmbeddingClient
from graph import build_agent_graph, run_analysis
from interfaces import Retriever
from llm import FireworksLLMClient, LLMClient, MockLLMClient
from retriever import QdrantRetriever
from router import DataRouter

from mocks import MockRetriever
from store import JobStore

logger = logging.getLogger(__name__)

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "raw_data_items.sample.json"

# Offline escape hatch: no API keys/Redis-adjacent services needed. Default
# is real wiring (production/demo) -- flip only for local dev without keys.
USE_MOCKS = os.environ.get("USE_MOCKS", "false").strip().lower() in ("1", "true", "yes")

FIREWORKS_SMALL_MODEL = os.environ.get(
    "FIREWORKS_SMALL_MODEL", "accounts/fireworks/models/gpt-oss-120b")
FIREWORKS_LARGE_MODEL = os.environ.get(
    "FIREWORKS_LARGE_MODEL", "accounts/fireworks/models/deepseek-v4-pro")
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:6333")

_STAGE_VERB = {
    "idea": "memvalidasi peluang",
    "new": "menganalisis posisi",
    "established": "menganalisis peluang pertumbuhan",
    "expanding": "menilai ekspansi",
}


class OrchestratorImpl:
    """Mematuhi interfaces.Orchestrator. USE_MOCKS=true -> semua Mock* (offline)."""

    def __init__(self, store: JobStore):
        self.store = store
        self.use_mocks = USE_MOCKS
        self._embedder: EmbeddingClient
        small_llm: LLMClient
        large_llm: LLMClient
        if self.use_mocks:
            self._embedder = MockEmbeddingClient()
            small_llm = large_llm = MockLLMClient()
        else:
            self._embedder = FireworksEmbeddingClient()
            # Model dibagi dua sesuai spek: kecil (dipanggil per-chunk, volume
            # tinggi) utk sentiment, besar (sekali per report) utk swot+summary.
            small_llm = FireworksLLMClient(model=FIREWORKS_SMALL_MODEL)
            large_llm = FireworksLLMClient(model=FIREWORKS_LARGE_MODEL)
        self._rerank_agent = HeuristicRerankAgent()
        self._sentiment_agent = SentimentAgentImpl(small_llm)
        self._swot_agent = SwotAgentImpl(large_llm)
        self._summary_agent = SummaryAgentImpl(large_llm)

    async def create_scope(self, inp: BusinessInput) -> ScopeConfig:
        loc = inp.location
        where = loc.district or loc.city
        verb = _STAGE_VERB.get(inp.business_stage.value, "menganalisis")

        keywords = [inp.business_type, f"{inp.business_type} {loc.city}"]
        for tc in inp.target_customers:
            keywords.append(f"{inp.business_type} {tc.value}")

        goals_txt = ", ".join(g.value for g in inp.primary_goals) or "analisis peluang umum"
        return ScopeConfig(
            business_input=inp,
            interpreted_summary=(
                f"Kami akan {verb} {inp.business_type} dalam radius {inp.radius_km:g}km "
                f"dari {where}, dengan fokus: {goals_txt}. Termasuk kompetitor lokal "
                f"dan sentimen area sekitarnya."
            ),
            search_keywords=keywords,
            competitor_query=f"{inp.business_type} {where}",
            expires_at=_now() + timedelta(hours=48),
        )

    async def run(self, scope: ScopeConfig) -> Report:
        try:
            await self.store.set_status(scope.scope_id, AnalysisStatus.SCRAPING)
            items, scraper_notes = await self._scrape(scope)

            await self.store.set_status(scope.scope_id, AnalysisStatus.ROUTING)
            router = DataRouter(embedder=self._embedder)
            routed = await router.route(items, scope, RouterConfig())

            await self.store.set_status(scope.scope_id, AnalysisStatus.PREPROCESSING)
            chunks = chunks_from_routed(routed)
            market_notes = [c.text for c in chunks if c.track == AnalysisTrack.MARKET]

            await self.store.set_status(scope.scope_id, AnalysisStatus.INDEXING)
            retriever = await self._build_retriever(scope, chunks)
            graph = build_agent_graph(
                retriever=retriever,
                rerank_agent=self._rerank_agent,
                sentiment_agent=self._sentiment_agent,
                swot_agent=self._swot_agent,
                summary_agent=self._summary_agent,
            )

            # ANALYZING and COMPOSING collapse into one graph.ainvoke() call
            # (run_summary is a node in the same graph, not a separate await
            # point) — status still transitions through both values so
            # frontend polling sees the same stage sequence as the dummy
            # pipeline did.
            await self.store.set_status(scope.scope_id, AnalysisStatus.ANALYZING)
            report = await run_analysis(graph, scope, market_notes=market_notes)
            # scraper-level degradation (e.g. a source with no API key) is
            # prepended so it's never silently dropped alongside graph-level
            # notes (retrieval/agent failures, added via the state reducer).
            report.degradation_notes = [*scraper_notes, *report.degradation_notes]

            # report (and thus sections_ready, derived from it) is persisted
            # before COMPOSING/final status flips, so a client polling
            # mid-write never observes sections_ready without a fetchable
            # report behind it.
            await self.store.set_status(scope.scope_id, AnalysisStatus.COMPOSING)
            await self.store.set_report(scope.scope_id, report)
            sections = [name for name, val in
                        (("sentiment", report.sentiment), ("swot", report.swot))
                        if val is not None]
            await self.store.set_sections_ready(scope.scope_id, sections)
            await self.store.set_status(scope.scope_id, report.status)
            return report
        except Exception as e:                       # noqa: BLE001
            logger.exception("Pipeline failed for scope %s", scope.scope_id)
            await self.store.set_status(scope.scope_id, AnalysisStatus.FAILED)
            await self.store.set_error(scope.scope_id, str(e))
            failed_report = Report(
                scope_id=scope.scope_id,
                status=AnalysisStatus.FAILED,
                executive_summary="",
                degradation_notes=[f"Pipeline gagal: {e}"],
            )
            await self.store.set_report(scope.scope_id, failed_report)
            return failed_report

    async def _scrape(self, scope: ScopeConfig) -> tuple[list[RawDataItem], list[str]]:
        """Real scraper (all 9 modules, circuit-breaker safe -- a source with
        no API key just contributes 0 items + a degradation note, per
        scraping/README.md) unless USE_MOCKS. Returns (items, degradation_notes)."""
        if self.use_mocks:
            return self._load_scraped_items(scope), []
        from scraping.runner import create_runner  # lazy: keeps offline path key-free

        result = await create_runner(use_mocks=False).run(scope)
        return result.items, result.degradation_notes

    async def _build_retriever(self, scope: ScopeConfig, chunks: list[Chunk]) -> Retriever:
        """MockRetriever holds all chunks in-process (fine, cheap). QdrantRetriever
        gets one collection per scope so concurrent analyses can't cross-contaminate
        each other's retrieval results; chunks must be ingested before the graph
        runs or retrieve() returns nothing (QdrantRetriever is search-only)."""
        if self.use_mocks:
            return MockRetriever(chunks)
        retriever = QdrantRetriever(
            embedder=self._embedder, url=QDRANT_URL,
            collection=f"boa_{scope.scope_id}")
        await retriever.ingest(chunks)
        return retriever

    @staticmethod
    def _load_scraped_items(scope: ScopeConfig) -> list[RawDataItem]:
        raw = json.loads(FIXTURES.read_text(encoding="utf-8"))
        return [RawDataItem(**d).model_copy(update={"scope_id": scope.scope_id}) for d in raw]
