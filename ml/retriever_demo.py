"""
ml/retriever_demo.py — Bukti QdrantRetriever jalan end-to-end: fixtures ->
DataRouter (routing/gate nyata, Bagian 4) -> chunking.chunks_from_routed ->
ingest ke Qdrant -> retrieve per track, filter payload track bekerja. Pakai
QdrantRetriever(location=":memory:") + MockEmbeddingClient supaya jalan tanpa
server Qdrant maupun bobot BGE-M3 nyata — murni verifikasi WIRING.

Produksi: ganti location=":memory:" -> url="http://<qdrant-host>:6333", dan
MockEmbeddingClient -> TEIEmbeddingClient/LocalBGEM3EmbeddingClient. Kode
retriever/graph tidak berubah (lihat interfaces.Retriever).

Jalankan:  PYTHONPATH="contracts;ml" uv run python ml/retriever_demo.py
"""
from __future__ import annotations

import asyncio
import json
from datetime import timedelta
from pathlib import Path

from contracts import (
    AnalysisTrack, BusinessInput, BusinessStage, IndustryCategory, Location,
    RawDataItem, RouterConfig, ScopeConfig, _now,
)
from embeddings import MockEmbeddingClient
from router import DataRouter
from chunking import chunks_from_routed
from retriever import QdrantRetriever

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "raw_data_items.sample.json"


async def main():
    items = [RawDataItem(**d) for d in json.loads(FIXTURES.read_text())]

    scope = ScopeConfig(
        business_input=BusinessInput(
            business_type="Kedai kopi specialty", description="manual brew + ruang kerja",
            location=Location(city="Cikarang", district="Cikarang Selatan", province="Jawa Barat"),
            category=IndustryCategory.FOOD_BEVERAGE, business_stage=BusinessStage.IDEA),
        interpreted_summary=(
            "Kami akan memvalidasi peluang Kedai kopi specialty dalam radius "
            "3km dari Cikarang Selatan, termasuk kompetitor lokal dan "
            "sentimen area sekitarnya."),
        competitor_query="kedai kopi Cikarang",
        expires_at=_now() + timedelta(hours=48))

    # ---- Routing dulu (Bagian 4) — retriever hanya boleh melihat item KEPT ----
    router = DataRouter(embedder=MockEmbeddingClient())
    routed = await router.route(items, scope, RouterConfig())
    chunks = chunks_from_routed(routed)
    print(f"Routing: {sum(1 for r in routed if r.decision.kept)}/{len(routed)} "
          f"item kept -> {len(chunks)} chunk.")

    retriever = QdrantRetriever(embedder=MockEmbeddingClient(), location=":memory:")
    n = await retriever.ingest(chunks)
    print(f"Ingested {n} chunks into in-memory Qdrant.")

    for track, query in [
        (AnalysisTrack.SENTIMENT, "sentimen kedai kopi Cikarang"),
        (AnalysisTrack.SWOT, "kedai kopi Cikarang"),
        (AnalysisTrack.MARKET, "statistik daya beli Cikarang"),
    ]:
        results = await retriever.retrieve(query, scope, track, top_k=10)
        print(f"\n[{track.value}] {len(results)} hasil (semua harus track={track.value}):")
        for rc in results:
            assert rc.chunk.track == track, "filter payload bocor lintas-track"
            print(f"  score={rc.dense_score:.3f}  {rc.chunk.source_name}: {rc.chunk.text[:60]!r}")

    print("\nPASS: routing -> chunking -> ingest -> hybrid retrieve -> filter "
          "per track, semua tersambung nyata (bukan mock track mapping).")


if __name__ == "__main__":
    asyncio.run(main())
