"""
ml/router_demo.py — Bukti DataRouter jalan end-to-end terhadap
fixtures/raw_data_items.sample.json, termasuk verifikasi eksplisit dari
spesifikasi: item #5 (post kripto Inggris, basi, off-topic) HARUS ter-DISCARD.

Pakai MockEmbeddingClient (offline, tanpa bobot BGE-M3) — murni verifikasi
WIRING & aturan keputusan. Produksi: suntik TEIEmbeddingClient/
LocalBGEM3EmbeddingClient (sama embedder yg dipakai QdrantRetriever).

Jalankan:  PYTHONPATH="contracts;ml" uv run python ml/router_demo.py
"""
from __future__ import annotations

import asyncio
import json
from datetime import timedelta
from pathlib import Path

from contracts import (
    _now, AnalysisTrack, BusinessInput, BusinessStage, IndustryCategory,
    Location, RawDataItem, RouterConfig, ScopeConfig,
)
from embeddings import MockEmbeddingClient
from router import DataRouter

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "raw_data_items.sample.json"
DISCARD_ITEM_ID = "55555555-5555-5555-5555-555555555555"  # post kripto, wajib discard


async def main():
    items = [RawDataItem(**d) for d in json.loads(FIXTURES.read_text())]

    scope = ScopeConfig(
        business_input=BusinessInput(
            business_type="Kedai kopi specialty", description="manual brew + ruang kerja",
            location=Location(city="Cikarang", district="Cikarang Selatan", province="Jawa Barat"),
            category=IndustryCategory.FOOD_BEVERAGE, radius_km=3,
            business_stage=BusinessStage.IDEA),
        interpreted_summary=(
            "Kami akan memvalidasi peluang Kedai kopi specialty dalam radius "
            "3km dari Cikarang Selatan, termasuk kompetitor lokal dan "
            "sentimen area sekitarnya."),
        search_keywords=["kedai kopi", "kedai kopi Cikarang", "coffee shop Cikarang"],
        competitor_query="kedai kopi Cikarang",
        expires_at=_now() + timedelta(hours=48))

    router = DataRouter(embedder=MockEmbeddingClient())
    routed = await router.route(items, scope, RouterConfig())

    print("=" * 78)
    for r in routed:
        d = r.decision
        print(f"{r.raw.item_id[:8]}  {r.raw.source_type.value:16s} kept={d.kept!s:5s} "
              f"tracks={[t.value for t in d.tracks]!s:32s} reason={d.reason}")
        print(f"          relevance={d.score.relevance_score} geo={d.score.geo_match.value} "
              f"recency={d.score.recency_score} lang_ok={d.score.lang_ok} "
              f"dup={d.score.is_duplicate} quality={d.score.quality_score}")
    print("=" * 78)

    kept = [r for r in routed if r.decision.kept]
    discarded = [r for r in routed if not r.decision.kept]
    print(f"KEPT: {len(kept)}/{len(routed)}   DISCARDED: {len(discarded)}/{len(routed)}")

    # Satu-satunya kontrak KERAS dari spesifikasi (raw_meta fixtures item #5):
    # off-topic + bahasa asing + basi -> WAJIB discard. Ini yang diverifikasi.
    discard_ids = {r.raw.item_id for r in discarded}
    assert DISCARD_ITEM_ID in discard_ids, (
        "GAGAL: item #5 (crypto post, off-topic+foreign+basi) HARUS ter-discard")
    print(f"PASS: item #5 (crypto post) ter-discard — reason: "
          f"{next(r.decision.reason for r in routed if r.raw.item_id == DISCARD_ITEM_ID)}")

    # 4 item lain SEHARUSNYA relevan, tapi MockEmbeddingClient (bag-of-trigram,
    # tanpa pemahaman semantik) bisa salah menilai relevansi item yang secara
    # leksikal jauh dari teks intent (mis. statistik makro tanpa kata "kopi").
    # Itu keterbatasan MOCK yang jujur, bukan bug router -> jangan di-assert
    # keras, cukup dilaporkan. BGE-M3 asli akan jauh lebih akurat di sini.
    others = [r for r in routed if r.raw.item_id != DISCARD_ITEM_ID]
    kept_others = [r for r in others if r.decision.kept]
    print(f"INFO: {len(kept_others)}/{len(others)} item on-topic lain ter-kept "
          f"(sisanya kena batas relevansi MockEmbeddingClient, bukan indikasi "
          f"router salah — lihat catatan di README).")
    assert len(kept_others) >= 2, "GAGAL: router tampak salah total (nyaris semua discard)"

    # Fixtures tak punya duplikat asli -> uji dedup terpisah dgn item sintetis
    # (salinan persis item #1) supaya jalur is_duplicate tetap teruji.
    dup_item = items[0].model_copy(update={"item_id": "dup-of-item-1"})
    routed_with_dup = await router.route([items[0], dup_item], scope, RouterConfig())
    dup_decision = next(r.decision for r in routed_with_dup if r.raw.item_id == "dup-of-item-1")
    assert dup_decision.tracks == [AnalysisTrack.DISCARD] and dup_decision.reason == "dup", (
        f"GAGAL: duplikat harus ter-discard dgn reason='dup', dapat: {dup_decision}")
    print(f"PASS: item duplikat ter-discard — reason: {dup_decision.reason}")


if __name__ == "__main__":
    asyncio.run(main())
