"""
ml/router.py — DataRouter: metrik routing deterministik & explainable
(Bagian 4 spesifikasi). Posisi: antara Scraping (Faiz) dan Preprocessing.

Gate + klasifikasi multi-label, SEMUA kuantitatif (tanpa LLM call per-item):
  1. is_duplicate                          -> DISCARD("dup")
  2. lang bukan {id,en} & relevance rendah -> DISCARD("foreign_lang")
  3. relevance < tau_discard                -> DISCARD("off_topic")
  4. selain itu: assign track (multi-label) dari source_type + geo.

relevance_score pakai embedding (BGE-M3 via embedder yang disuntik, sama pola
dgn retriever.py) — cosine sim antara embedding(item.raw_text) vs
embedding(scope intent). quality_score dipakai lagi sbg dasar confidence
(Bagian 8.2), jadi satu metrik dua kebutuhan.
"""
from __future__ import annotations

from datetime import datetime

from contracts import (
    _now, AnalysisTrack, GeoMatch, Location, RawDataItem, RoutedDataItem,
    RoutingDecision, RoutingScore, RouterConfig, ScopeConfig, SourceType,
)
from embeddings import EmbeddingClient

_SENTIMENT_SOURCES = {SourceType.REVIEW, SourceType.FORUM, SourceType.SOCIAL}
_SWOT_ONLY_SOURCES = {SourceType.PLACES_LISTING}
_SWOT_NEWS_SOURCES = {SourceType.NEWS, SourceType.BLOG, SourceType.ARTICLE}
_MARKET_SOURCES = {SourceType.TRENDS, SourceType.BPS_STAT, SourceType.DATABOKS}

_GEO_WEIGHT = {GeoMatch.EXACT: 1.0, GeoMatch.CITY: 0.75, GeoMatch.REGION: 0.4, GeoMatch.NONE: 0.0}


class DataRouter:
    """Rule-based + embedding-similarity. Mematuhi interfaces.DataRouter."""

    def __init__(self, embedder: EmbeddingClient):
        self.embedder = embedder

    async def route(
        self, items: list[RawDataItem], scope: ScopeConfig, config: RouterConfig
    ) -> list[RoutedDataItem]:
        if not items:
            return []

        texts = [_scope_intent_text(scope), *[it.raw_text for it in items]]
        vectors = await self.embedder.embed(texts)
        intent_vec, item_vecs = vectors[0], vectors[1:]

        routed: list[RoutedDataItem] = []
        kept_vecs: list[list[float]] = []  # dense vectors of item KEPT so far

        for item, vec in zip(items, item_vecs):
            relevance = round(_cosine(vec.dense, intent_vec.dense), 4)
            is_dup = any(_cosine(vec.dense, other) >= config.dup_similarity_threshold
                         for other in kept_vecs)
            geo = _geo_match(item.geo_hint, scope.business_input.location)
            recency = round(_recency_score(item.published_at, config.recency_halflife_days), 4)
            lang_ok = item.lang_hint in ("id", "en")
            quality = round(
                config.w_relevance * relevance
                + config.w_geo * _GEO_WEIGHT[geo]
                + config.w_recency * recency, 4)

            score = RoutingScore(
                relevance_score=relevance, geo_match=geo, recency_score=recency,
                lang_ok=lang_ok, is_duplicate=is_dup, quality_score=quality)

            tracks, reason = _decide_tracks(item, score, config)
            kept = AnalysisTrack.DISCARD not in tracks

            routed.append(RoutedDataItem(raw=item, decision=RoutingDecision(
                item_id=item.item_id, tracks=tracks, score=score, reason=reason, kept=kept)))

            if kept:
                kept_vecs.append(vec.dense)

        return routed


def _scope_intent_text(scope: ScopeConfig) -> str:
    # interpreted_summary sengaja jadi anchor utama: itu satu kalimat yang
    # SUDAH disintesis dari seluruh scope (Bagian 2 spesifikasi). Menambah
    # search_keywords mentah ke sini bikin vektor didominasi frasa berulang
    # (mis. "kedai kopi" x4) & justru MENURUNKAN cosine similarity ke review
    # asli yang pendek — makin banyak teks intent, makin encer sinyalnya.
    bi = scope.business_input
    parts, seen = [], set()
    for p in (scope.interpreted_summary, bi.business_type, bi.description):
        if p and p not in seen:
            seen.add(p)
            parts.append(p)
    return " ".join(parts)


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(x * x for x in b) ** 0.5
    if na == 0 or nb == 0:
        return 0.0
    return max(-1.0, min(1.0, dot / (na * nb)))


def _geo_match(item_geo: Location | None, scope_loc: Location) -> GeoMatch:
    if not item_geo:
        return GeoMatch.NONE
    if (item_geo.district and scope_loc.district
            and item_geo.district.strip().lower() == scope_loc.district.strip().lower()):
        return GeoMatch.EXACT
    if (item_geo.city and scope_loc.city
            and item_geo.city.strip().lower() == scope_loc.city.strip().lower()):
        return GeoMatch.CITY
    if (item_geo.province and scope_loc.province
            and item_geo.province.strip().lower() == scope_loc.province.strip().lower()):
        return GeoMatch.REGION
    return GeoMatch.NONE


def _recency_score(published_at: datetime | None, halflife_days: float) -> float:
    if published_at is None:
        return 0.5  # tanpa tanggal eksplisit -> netral, jangan dihukum penuh
    age_days = max(0.0, (_now() - published_at).total_seconds() / 86400)
    return 0.5 ** (age_days / halflife_days)


def _decide_tracks(
    item: RawDataItem, score: RoutingScore, config: RouterConfig
) -> tuple[list[AnalysisTrack], str]:
    if score.is_duplicate:
        return [AnalysisTrack.DISCARD], "dup"

    if not score.lang_ok and score.relevance_score < config.tau_foreign_lang_keep:
        return [AnalysisTrack.DISCARD], (
            f"foreign_lang (relevance {score.relevance_score:.2f} "
            f"< {config.tau_foreign_lang_keep})")

    if score.relevance_score < config.tau_discard:
        return [AnalysisTrack.DISCARD], (
            f"off_topic (relevance {score.relevance_score:.2f} < {config.tau_discard})")

    st = item.source_type
    if st in _SENTIMENT_SOURCES:
        return [AnalysisTrack.SENTIMENT], f"{st.value}+geo:{score.geo_match.value} -> sentiment"
    if st in _SWOT_ONLY_SOURCES:
        return [AnalysisTrack.SWOT], f"{st.value} -> swot"
    if st in _SWOT_NEWS_SOURCES:
        # "+ SENTIMENT bila opini/geo cocok" (spesifikasi §4) — mendeteksi
        # "opini" murah tanpa LLM tak mungkin di sini, jadi dipakai proksi
        # geo dekat (EXACT/CITY) sbg sinyal item cukup lokal utk juga
        # menyumbang sentimen area, bukan cuma fakta pasar.
        if score.geo_match in (GeoMatch.EXACT, GeoMatch.CITY):
            return ([AnalysisTrack.SWOT, AnalysisTrack.SENTIMENT],
                     f"{st.value}+geo:{score.geo_match.value} -> swot+sentiment")
        return [AnalysisTrack.SWOT], f"{st.value} -> swot"
    if st in _MARKET_SOURCES:
        return [AnalysisTrack.MARKET], f"{st.value} -> market"

    return [AnalysisTrack.DISCARD], f"unknown_source_type:{st.value}"
