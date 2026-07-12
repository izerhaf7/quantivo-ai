"""ml/real_pipeline_demo.py — proof that the FULL real pipeline works
end-to-end together: real scraper -> real DataRouter (Fireworks embeddings)
-> real chunking -> real QdrantRetriever (Fireworks embeddings, :memory:
Qdrant since no server is available in this dev environment -- same
sanctioned in-process mode retriever_demo.py already uses) -> real
FireworksLLMClient agents (small model for sentiment, large for
swot+summary) -> real Report.

This is NOT what backend/orchestrator.py runs (that hits a real Qdrant
server via QDRANT_URL) -- it exercises the exact same real component classes
in the exact same order, just swapping the Qdrant transport, which is the
only piece impossible to verify without Docker in this environment.

Needs FIREWORKS_API_KEY (.env) and at least one real scraper key to produce
non-empty items (GOOGLE_PLACES_API_KEY/TAVILY_API_KEY etc. -- degrades
gracefully to fewer items if some are missing, per the circuit breaker).

Run:
  PYTHONPATH=".;contracts;ml" uv run python ml/real_pipeline_demo.py
"""
from __future__ import annotations

import asyncio
import os
import sys
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

from contracts import (
    _now, BusinessInput, ScopeConfig, Location, IndustryCategory,
    BusinessStage, PrimaryGoal, TargetCustomer, AnalysisTrack, RouterConfig,
)
from embeddings import FireworksEmbeddingClient
from llm import FireworksLLMClient
from router import DataRouter
from chunking import chunks_from_routed
from retriever import QdrantRetriever
from agents import (
    HeuristicRerankAgent, SentimentAgentImpl, SwotAgentImpl, SummaryAgentImpl,
)
from graph import build_agent_graph, run_analysis

ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
FIREWORKS_SMALL_MODEL = os.environ.get(
    "FIREWORKS_SMALL_MODEL", "accounts/fireworks/models/gpt-oss-120b")
FIREWORKS_LARGE_MODEL = os.environ.get(
    "FIREWORKS_LARGE_MODEL", "accounts/fireworks/models/deepseek-v4-pro")


async def main() -> None:
    load_dotenv(ROOT_ENV)
    if not os.environ.get("FIREWORKS_API_KEY"):
        sys.exit("FIREWORKS_API_KEY tidak diset -- isi .env dulu.")

    scope = ScopeConfig(
        business_input=BusinessInput(
            business_type="Kedai kopi specialty",
            description="Kopi manual brew + ruang kerja",
            location=Location(city="Bandung", district="Dago", province="Jawa Barat"),
            category=IndustryCategory.FOOD_BEVERAGE, radius_km=3,
            business_stage=BusinessStage.IDEA,
            primary_goals=[PrimaryGoal.VALIDATE_IDEA, PrimaryGoal.KNOW_COMPETITORS],
            target_customers=[TargetCustomer.STUDENTS, TargetCustomer.OFFICE_WORKERS]),
        interpreted_summary=(
            "Kami akan memvalidasi peluang kedai kopi specialty dalam radius "
            "3km dari Dago, Bandung, termasuk kompetitor lokal dan sentimen "
            "area sekitarnya."),
        search_keywords=["kedai kopi Dago Bandung", "kopi specialty Bandung"],
        competitor_query="kedai kopi Dago Bandung",
        expires_at=_now() + timedelta(hours=1))

    print("1/6  Scraping (real modules, real API keys)...")
    from scraping.runner import create_runner
    scraper_result = await create_runner(use_mocks=False).run(scope)
    print(f"     -> {scraper_result.total_deduped} items after dedup "
          f"(from {scraper_result.total_raw} raw)")
    if scraper_result.degradation_notes:
        print("     degradation:", "; ".join(scraper_result.degradation_notes))
    assert scraper_result.total_deduped > 0, "scraper returned 0 items -- check API keys"

    embedder = FireworksEmbeddingClient()

    print("2/6  Routing (real DataRouter, real Fireworks embeddings)...")
    router = DataRouter(embedder=embedder)
    routed = await router.route(scraper_result.items, scope, RouterConfig())
    kept = sum(1 for r in routed if r.decision.kept)
    print(f"     -> {kept}/{len(routed)} items kept")

    print("3/6  Chunking...")
    chunks = chunks_from_routed(routed)
    market_notes = [c.text for c in chunks if c.track == AnalysisTrack.MARKET]
    print(f"     -> {len(chunks)} chunks "
          f"(sentiment={sum(1 for c in chunks if c.track == AnalysisTrack.SENTIMENT)}, "
          f"swot={sum(1 for c in chunks if c.track == AnalysisTrack.SWOT)}, "
          f"market={len(market_notes)})")
    assert chunks, "no chunks survived routing -- check relevance thresholds / embeddings"

    print("4/6  Ingesting into Qdrant (:memory:, real Fireworks embeddings)...")
    retriever = QdrantRetriever(embedder=embedder, location=":memory:", collection="real_pipeline_demo")
    n = await retriever.ingest(chunks)
    print(f"     -> ingested {n} points")

    print("5/6  Building agent graph (real FireworksLLMClient, small+large split)...")
    graph = build_agent_graph(
        retriever=retriever,
        rerank_agent=HeuristicRerankAgent(),
        sentiment_agent=SentimentAgentImpl(FireworksLLMClient(model=FIREWORKS_SMALL_MODEL)),
        swot_agent=SwotAgentImpl(FireworksLLMClient(model=FIREWORKS_LARGE_MODEL)),
        summary_agent=SummaryAgentImpl(FireworksLLMClient(model=FIREWORKS_LARGE_MODEL)))

    print("6/6  Running analysis (real LLM reasoning, this calls Fireworks several times)...")
    report = await run_analysis(graph, scope, market_notes=market_notes)

    print("=" * 72)
    print("STATUS         :", report.status.value)
    print("EXEC SUMMARY   :", report.executive_summary)
    print("NARRATIVE      :", report.narrative[:200], "...")
    print("SENTIMENT DIST :", report.sentiment.overall_distribution if report.sentiment else None)
    print("SWOT strengths :", report.swot.strengths if report.swot else None)
    print("SWOT threats   :", report.swot.threats if report.swot else None)
    print("COMPETITORS    :", [(c.name, c.rating_aggregate, c.review_count, bool(c.place_id))
                                for c in (report.swot.competitors if report.swot else [])][:5])
    print("RECOMMENDATIONS:", report.recommendations)
    print("DEGRADATION    :", report.degradation_notes or "(none)")
    print("=" * 72)

    assert report.status.value != "failed", "pipeline failed end-to-end"
    assert report.executive_summary, "executive_summary empty"
    assert report.swot and any(c.place_id for c in report.swot.competitors), \
        "no competitor carries a real place_id -- B7 wiring regression"
    print("\nPASS: full real pipeline (scraper -> router -> retriever -> LLM agents) "
          "ran end-to-end with real data and real reasoning.")


if __name__ == "__main__":
    asyncio.run(main())
