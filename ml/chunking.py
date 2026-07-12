"""
ml/chunking.py — Bentuk Chunk dari hasil DataRouter (Bagian 4 -> RAG Bagian 3).

Preprocessing minimal antara routing dan retrieval: item yang TIDAK `kept`
(di-discard router) tak pernah sampai sini. Item dgn track multi-label
(mis. news yang dapat SWOT+SENTIMENT) menghasilkan SATU Chunk PER TRACK,
karena `Chunk.track` singular ("chunk mewarisi track dari item induk").

`relevance_score`/`recency_score` pada Chunk DIWARISI langsung dari
`RoutingScore` -- bukan dihitung ulang -- karena metrik routing dipakai lagi
sbg dasar confidence per-section (Bagian 8.2): satu metrik, dua kebutuhan.
"""
from __future__ import annotations

from contracts import Chunk, RoutedDataItem


def chunks_from_routed(routed: list[RoutedDataItem]) -> list[Chunk]:
    chunks: list[Chunk] = []
    for r in routed:
        if not r.decision.kept:
            continue
        item = r.raw
        text = f"{item.title} - {item.raw_text}" if item.title else item.raw_text
        for track in r.decision.tracks:
            chunks.append(Chunk(
                scope_id=item.scope_id, source_item_id=item.item_id, track=track,
                text=text, source_type=item.source_type, source_name=item.source_name,
                geo_tag=item.geo_hint, published_at=item.published_at,
                relevance_score=r.decision.score.relevance_score,
                recency_score=r.decision.score.recency_score,
                place_id=item.place_id, rating_aggregate=item.rating_aggregate,
                review_count=item.review_count))
    return chunks
