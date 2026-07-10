"""
ml/llm_demo.py — Bukti FireworksLLMClient jalan nyata (bukan MockLLMClient).

Pipeline sama seperti run_demo.py (fixtures -> DataRouter -> chunking ->
MockRetriever -> graph agent), tapi LLM-nya FireworksLLMClient sungguhan,
jalan di AMD MI300X/MI350 (lihat spesifikasi-teknis-boa-saas.md Bagian 3).
Retriever & embedder tetap mock di sini — file ini murni membuktikan LLM
reasoning-nya, bukan retrieval (itu domain retriever_demo.py).

Model DIBAGI dua sesuai spek: model kecil (7-8B) untuk sentiment_classify
(dipanggil PER CHUNK, jadi volume tinggi -> murah & cepat penting), model
besar (70B) untuk swot_synthesize/summary_compose (dipanggil sekali per
report -> kualitas reasoning lebih penting). Slug model Fireworks berubah
dari waktu ke waktu -- cek https://fireworks.ai/models kalau FIREWORKS_SMALL_MODEL
di bawah sudah deprecated.

Butuh FIREWORKS_API_KEY (lihat .env.example). Jalankan:
  PYTHONPATH="contracts;ml" uv run python ml/llm_demo.py
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

from contracts import (
    _now, RawDataItem, ScopeConfig, BusinessInput, Location, IndustryCategory,
    BusinessStage, PrimaryGoal, TargetCustomer,
    Chunk, RetrievedChunk, AnalysisTrack, RouterConfig,
)
from llm import FireworksLLMClient
from embeddings import MockEmbeddingClient
from router import DataRouter
from chunking import chunks_from_routed
from agents import (
    HeuristicRerankAgent, SentimentAgentImpl, SwotAgentImpl, SummaryAgentImpl,
)
from graph import build_agent_graph, run_analysis

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "raw_data_items.sample.json"

FIREWORKS_SMALL_MODEL = "accounts/fireworks/models/llama-v3p1-8b-instruct"
FIREWORKS_LARGE_MODEL = "accounts/fireworks/models/llama-v3p3-70b-instruct"


class MockRetriever:
    """Sama seperti run_demo.py — file ini fokus membuktikan LLM, bukan retrieval."""
    def __init__(self, chunks: list[Chunk]):
        self.chunks = chunks

    async def ingest(self, chunks): return len(chunks)

    async def retrieve(self, query, scope, track, top_k=30):
        hits = [c for c in self.chunks if c.track == track][:top_k]
        return [RetrievedChunk(chunk=c, dense_score=0.7, sparse_score=0.3) for c in hits]


async def main():
    load_dotenv()
    if not os.environ.get("FIREWORKS_API_KEY"):
        sys.exit("FIREWORKS_API_KEY tidak diset. Copy .env.example -> .env dan isi key-nya dulu.")

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

    router = DataRouter(embedder=MockEmbeddingClient())
    routed = await router.route(items, scope, RouterConfig())
    chunks = chunks_from_routed(routed)
    market_notes = [c.text for c in chunks if c.track == AnalysisTrack.MARKET]
    print(f"Routing: {sum(1 for r in routed if r.decision.kept)}/{len(routed)} "
          f"item kept -> {len(chunks)} chunk.")

    sentiment_llm = FireworksLLMClient(model=FIREWORKS_SMALL_MODEL)
    reasoning_llm = FireworksLLMClient(model=FIREWORKS_LARGE_MODEL)

    graph = build_agent_graph(
        retriever=MockRetriever(chunks),
        rerank_agent=HeuristicRerankAgent(),
        sentiment_agent=SentimentAgentImpl(sentiment_llm),
        swot_agent=SwotAgentImpl(reasoning_llm),
        summary_agent=SummaryAgentImpl(reasoning_llm))

    report = await run_analysis(graph, scope, market_notes=market_notes)

    print("=" * 68)
    print("STATUS       :", report.status.value)
    print("EXEC SUMMARY :", report.executive_summary)
    print("NARRATIVE    :", report.narrative)
    print("SENTIMENT    :", report.sentiment.overall_distribution if report.sentiment else None)
    print("SWOT opps    :", report.swot.opportunities if report.swot else None)
    print("SWOT threats :", report.swot.threats if report.swot else None)
    print("REKOMENDASI  :", report.recommendations)
    print("DEGRADASI    :", report.degradation_notes or "(tidak ada)")
    print("=" * 68)

    assert report.status.value != "failed", "LLM reasoning gagal total"
    assert report.executive_summary, "executive_summary kosong -- cek respons Fireworks"
    print("\nPASS: FireworksLLMClient nyata (model kecil utk sentiment, "
          "model besar utk swot+summary) jalan end-to-end di AMD hardware.")


if __name__ == "__main__":
    asyncio.run(main())
