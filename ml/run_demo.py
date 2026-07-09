"""
ml/run_demo.py — Bukti graph jalan end-to-end tanpa API key / infra.

Pipeline demo penuh: fixtures -> DataRouter (routing/gate nyata, Bagian 4) ->
chunking.chunks_from_routed -> MockRetriever (Chunk -> RetrievedChunk) ->
graph agent. Untuk produksi, ganti MockRetriever -> QdrantRetriever,
MockEmbeddingClient -> BGE-M3 nyata, dan MockLLMClient -> FireworksLLMClient.

Jalankan:  PYTHONPATH=../contracts:. python run_demo.py
"""
from __future__ import annotations

import asyncio
import json
from datetime import timedelta
from pathlib import Path

from contracts import (
    _now, RawDataItem, ScopeConfig, BusinessInput, Location, IndustryCategory,
    BusinessStage, PrimaryGoal, TargetCustomer,
    Chunk, RetrievedChunk, AnalysisTrack, RouterConfig,
)
from llm import MockLLMClient
from embeddings import MockEmbeddingClient
from router import DataRouter
from chunking import chunks_from_routed
from agents import (
    HeuristicRerankAgent, SentimentAgentImpl, SwotAgentImpl, SummaryAgentImpl,
)
from graph import build_agent_graph, run_analysis

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "raw_data_items.sample.json"


class MockRetriever:
    """Simpan Chunk yang SUDAH melewati DataRouter; retrieve() memfilter per
    track. Ganti dgn QdrantRetriever (retriever.py) di produksi."""
    def __init__(self, chunks: list[Chunk]):
        self.chunks = chunks

    async def ingest(self, chunks): return len(chunks)

    async def retrieve(self, query, scope, track, top_k=30):
        hits = [c for c in self.chunks if c.track == track][:top_k]
        return [RetrievedChunk(chunk=c, dense_score=0.7, sparse_score=0.3) for c in hits]


async def main():
    items = [RawDataItem(**d) for d in json.loads(FIXTURES.read_text())]

    scope = ScopeConfig(
        business_input=BusinessInput(
            business_type="Kedai kopi specialty", description="manual brew + ruang kerja",
            location=Location(city="Cikarang", district="Cikarang Selatan", province="Jawa Barat"),
            category=IndustryCategory.FOOD_BEVERAGE, radius_km=3,
            business_stage=BusinessStage.IDEA,
            primary_goals=[PrimaryGoal.VALIDATE_IDEA, PrimaryGoal.KNOW_COMPETITORS],
            target_customers=[TargetCustomer.OFFICE_WORKERS, TargetCustomer.STUDENTS]),
        interpreted_summary=(
            "Kami akan memvalidasi peluang Kedai kopi specialty dalam radius "
            "3km dari Cikarang Selatan, termasuk kompetitor lokal dan "
            "sentimen area sekitarnya."),
        competitor_query="kedai kopi Cikarang",
        expires_at=_now() + timedelta(hours=48))

    # ---- Routing (Bagian 4) — gate + klasifikasi multi-label nyata ----
    router = DataRouter(embedder=MockEmbeddingClient())
    routed = await router.route(items, scope, RouterConfig())

    print("=" * 68)
    print("ROUTING:")
    for r in routed:
        print(f"  {r.raw.item_id[:8]} {r.raw.source_type.value:16s} "
              f"kept={r.decision.kept!s:5s} reason={r.decision.reason}")
    kept_n = sum(1 for r in routed if r.decision.kept)
    print(f"  -> {kept_n}/{len(routed)} item kept setelah routing")

    chunks = chunks_from_routed(routed)
    market_notes = [c.text for c in chunks if c.track == AnalysisTrack.MARKET]

    llm = MockLLMClient()
    graph = build_agent_graph(
        retriever=MockRetriever(chunks),
        rerank_agent=HeuristicRerankAgent(),
        sentiment_agent=SentimentAgentImpl(llm),
        swot_agent=SwotAgentImpl(llm),
        summary_agent=SummaryAgentImpl(llm))

    report = await run_analysis(graph, scope, market_notes=market_notes)

    print("=" * 68)
    print("STATUS       :", report.status.value)
    print("EXEC SUMMARY :", report.executive_summary)
    print("SENTIMENT    :", report.sentiment.overall_distribution if report.sentiment else None,
          "| confidence:", report.sentiment.confidence.explanation if report.sentiment else "-")
    print("SWOT opps    :", report.swot.opportunities if report.swot else None)
    print("SWOT threats :", report.swot.threats if report.swot else None,
          "| confidence:", report.swot.confidence.explanation if report.swot else "-")
    print("KOMPETITOR   :", [c.name for c in report.swot.competitors] if report.swot else None)
    print("REKOMENDASI  :", report.recommendations)
    hm = (report.visualizations.sentiment_chart_data or {}).get("heatmap", {})
    print("HEATMAP feat :", len(hm.get("features", [])), "titik geografis")
    print("DEGRADASI    :", report.degradation_notes or "(tidak ada)")
    print("=" * 68)


if __name__ == "__main__":
    asyncio.run(main())
