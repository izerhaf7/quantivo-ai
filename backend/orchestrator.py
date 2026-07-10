"""
backend/orchestrator.py — OrchestratorImpl(interfaces.Orchestrator).

Wires SCRAPING -> ROUTING -> PREPROCESSING -> INDEXING -> ANALYZING ->
COMPOSING to real ml/ implementations via the Protocols in
contracts/interfaces.py, writing progress to JobStore as it goes. Default
wiring is fully offline (Mock*Client), per CLAUDE.md's mock-first
convention. Scraper stand-in reads fixtures/raw_data_items.sample.json
until scraping/ has a real implementation.

Rerank/Sentiment/SWOT/Summary agents are stateless and built once in
__init__. The retriever (and the graph that closes over it) is rebuilt
per run() call, since MockRetriever holds per-job chunk state — see
mocks.py for why it must not be shared across concurrent jobs.
"""
from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path

from contracts import (
    _now, AnalysisStatus, AnalysisTrack, BusinessInput, RawDataItem, Report,
    RouterConfig, ScopeConfig,
)
from agents import (
    HeuristicRerankAgent, SentimentAgentImpl, SummaryAgentImpl, SwotAgentImpl,
)
from chunking import chunks_from_routed
from embeddings import MockEmbeddingClient
from graph import build_agent_graph, run_analysis
from llm import MockLLMClient
from router import DataRouter

from mocks import MockRetriever
from store import JobStore

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "raw_data_items.sample.json"

_STAGE_VERB = {
    "idea": "memvalidasi peluang",
    "new": "menganalisis posisi",
    "established": "menganalisis peluang pertumbuhan",
    "expanding": "menilai ekspansi",
}


class OrchestratorImpl:
    """Mematuhi interfaces.Orchestrator. Default wiring: semua Mock* (offline)."""

    def __init__(self, store: JobStore):
        self.store = store
        llm = MockLLMClient()
        self._rerank_agent = HeuristicRerankAgent()
        self._sentiment_agent = SentimentAgentImpl(llm)
        self._swot_agent = SwotAgentImpl(llm)
        self._summary_agent = SummaryAgentImpl(llm)

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
            items = self._load_scraped_items(scope)

            await self.store.set_status(scope.scope_id, AnalysisStatus.ROUTING)
            router = DataRouter(embedder=MockEmbeddingClient())
            routed = await router.route(items, scope, RouterConfig())

            await self.store.set_status(scope.scope_id, AnalysisStatus.PREPROCESSING)
            chunks = chunks_from_routed(routed)
            market_notes = [c.text for c in chunks if c.track == AnalysisTrack.MARKET]

            await self.store.set_status(scope.scope_id, AnalysisStatus.INDEXING)
            graph = build_agent_graph(
                retriever=MockRetriever(chunks),
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

            sections = [name for name, val in
                        (("sentiment", report.sentiment), ("swot", report.swot))
                        if val is not None]
            await self.store.set_sections_ready(scope.scope_id, sections)

            await self.store.set_status(scope.scope_id, AnalysisStatus.COMPOSING)
            await self.store.set_report(scope.scope_id, report)
            await self.store.set_status(scope.scope_id, report.status)
            return report
        except Exception as e:                       # noqa: BLE001
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

    @staticmethod
    def _load_scraped_items(scope: ScopeConfig) -> list[RawDataItem]:
        raw = json.loads(FIXTURES.read_text(encoding="utf-8"))
        return [RawDataItem(**d).model_copy(update={"scope_id": scope.scope_id}) for d in raw]
