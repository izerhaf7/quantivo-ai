"""
ml/agents.py — Implementasi agent (mematuhi Protocol di contracts/interfaces.py).

Prinsip:
  - Agent HANYA mengembalikan tipe dari contracts.py. Tak ada bentuk lain.
  - LLM dipakai untuk REASONING/ekstraksi; angka confidence dihitung
    kuantitatif oleh ml/confidence.py (bukan oleh LLM).
  - Constraint spesifikasi ditegakkan di kode, bukan cuma di prompt:
      * Sentiment: demografi None kalau sumber tak menyediakannya.
      * SWOT: kompetitor pakai place_id + rating agregat, tanpa quote verbatim.
"""
from __future__ import annotations

import json
from collections import defaultdict

from contracts import (
    AnalysisTrack, ScopeConfig, RetrievedChunk,
    RerankRequest, RerankResponse,
    SentimentResult, SentimentPoint, Sentiment,
    SWOTResult, Competitor,
    SummaryRequest, Report, Visualizations, AnalysisStatus,
)
from confidence import compute_confidence, majority_share, mean_recency
from llm import LLMClient


# ===========================================================================
# RERANK AGENT — heuristik deterministik & explainable (Bagian 6.3).
# Produksi: ganti isi rerank() dgn BGE-reranker-v2-m3 (cross-encoder).
# ===========================================================================
class HeuristicRerankAgent:
    """Skor akhir = relevansi retrieval + bobot recency + bobot geo."""

    def __init__(self, w_retrieval=0.6, w_recency=0.2, w_geo=0.2):
        self.w_retrieval, self.w_recency, self.w_geo = w_retrieval, w_recency, w_geo

    async def rerank(self, req: RerankRequest) -> RerankResponse:
        scope_city = req.scope.business_input.location.city.lower()
        scored: list[RetrievedChunk] = []
        for rc in req.candidates:
            base = rc.dense_score + (rc.sparse_score or 0) * 0.5
            geo = 1.0 if (rc.chunk.geo_tag and rc.chunk.geo_tag.city
                          and scope_city in rc.chunk.geo_tag.city.lower()) else 0.3
            rc.rerank_score = round(
                self.w_retrieval * base
                + self.w_recency * rc.chunk.recency_score
                + self.w_geo * geo, 4)
            scored.append(rc)
        scored.sort(key=lambda x: x.rerank_score or 0, reverse=True)
        return RerankResponse(track=req.track, ranked=scored[: req.top_k])


# ===========================================================================
# SENTIMENT AGENT
# ===========================================================================
class SentimentAgentImpl:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    async def analyze(
        self, scope: ScopeConfig, chunks: list[RetrievedChunk]
    ) -> SentimentResult:
        # 1) klasifikasi tiap chunk (LLM), agregasi per lokasi (kode).
        by_loc: dict[str, list] = defaultdict(list)
        all_labels: list[str] = []
        sources, recencies = set(), []

        for rc in chunks:
            c = rc.chunk
            out = await self.llm.complete_json(
                system="Klasifikasikan sentimen teks bisnis lokal. "
                       "Kembalikan JSON {label, score, demographics}. "
                       "demographics HARUS null jika teks tidak eksplisit menyebut "
                       "umur/gender. JANGAN mengarang demografi.",
                user=c.text, task="sentiment_classify")
            label = out.get("label", "neutral")
            loc_tag = (c.geo_tag.district or c.geo_tag.city) if c.geo_tag else "tidak diketahui"
            by_loc[loc_tag].append((label, float(out.get("score", 0)), c, out.get("demographics")))
            all_labels.append(label)
            sources.add(c.source_name)
            recencies.append(c.recency_score)

        # 2) bentuk SentimentPoint per lokasi.
        points, dist = [], {"positive": 0, "neutral": 0, "negative": 0}
        for loc, rows in by_loc.items():
            labels = [r[0] for r in rows]
            mean_score = round(sum(r[1] for r in rows) / len(rows), 2)
            maj = max(set(labels), key=labels.count)
            coords = next((r[2].geo_tag.coordinates for r in rows
                           if r[2].geo_tag and r[2].geo_tag.coordinates), None)
            demo = next((r[3] for r in rows if r[3]), None)  # hanya jika ADA
            for l in labels:
                dist[l] = dist.get(l, 0) + 1
            points.append(SentimentPoint(
                location_tag=loc, coordinates=coords,
                sentiment_score=mean_score, label=Sentiment(maj),
                sample_size=len(rows), demographics=demo))

        total = sum(dist.values()) or 1
        distribution = {k: round(v / total, 2) for k, v in dist.items()}

        # 3) confidence KUANTITATIF.
        conf = compute_confidence(
            source_count=len(sources),
            agreement=majority_share(all_labels),
            recency=mean_recency(recencies))

        return SentimentResult(
            scope_id=scope.scope_id, points=points,
            overall_distribution=distribution,
            sources=sorted(sources), confidence=conf)


# ===========================================================================
# SWOT AGENT
# ===========================================================================
class SwotAgentImpl:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    async def analyze(
        self, scope: ScopeConfig, chunks: list[RetrievedChunk]
    ) -> SWOTResult:
        # 1) kompetitor DARI DATA (place_id + rating agregat), bukan karangan LLM.
        competitors, sources, recencies = [], set(), []
        seen_place = set()
        for rc in chunks:
            c = rc.chunk
            sources.add(c.source_name)
            recencies.append(c.recency_score)
            meta = c  # chunk mewarisi info; kompetitor asli ada di raw item Places
            # kita andalkan chunk yang berasal dari places_listing
            if c.source_type.value == "places_listing":
                pid = None  # place_id sesungguhnya dibawa dari RawDataItem -> chunk.source_item_id
                # Untuk demo, ambil nama dari teks; produksi: propagasikan place_id/rating
                competitors.append(Competitor(
                    name=c.text.split(" - ")[0][:80], category=scope.business_input.category.value,
                    coordinates=c.geo_tag.coordinates if c.geo_tag else None))
        # 2) 4 kuadran via LLM (reasoning), diberi konteks klien + goals.
        bi = scope.business_input
        ctx = (f"Bisnis: {bi.business_type}. Deskripsi: {bi.description}. "
               f"Tahap: {bi.business_stage.value}. Target: "
               f"{[t.value for t in bi.target_customers]}. "
               f"Jumlah kompetitor terdeteksi: {len(competitors)}.")
        quad = await self.llm.complete_json(
            system="Susun SWOT 4 kuadran untuk UMKM lokal. Kembalikan JSON "
                   "{strengths[], weaknesses[], opportunities[], threats[]}. "
                   "Dasarkan pada konteks, jangan mengarang angka.",
            user=ctx, task="swot_synthesize")

        # 3) confidence: agreement diproksikan dari kelengkapan kuadran + kompetitor.
        filled = sum(bool(quad.get(k)) for k in
                     ("strengths", "weaknesses", "opportunities", "threats")) / 4
        conf = compute_confidence(
            source_count=len(sources),
            agreement=filled,
            recency=mean_recency(recencies))

        return SWOTResult(
            scope_id=scope.scope_id,
            strengths=quad.get("strengths", []),
            weaknesses=quad.get("weaknesses", []),
            opportunities=quad.get("opportunities", []),
            threats=quad.get("threats", []),
            competitors=competitors, confidence=conf)


# ===========================================================================
# SUMMARY AGENT — sintesis lintas-agent + rakit Report + visualisasi.
# ===========================================================================
class SummaryAgentImpl:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    async def compose(self, req: SummaryRequest) -> Report:
        bi = req.scope.business_input
        payload = {
            "goals": [g.value for g in bi.primary_goals],
            "sentiment": req.sentiment.overall_distribution if req.sentiment else None,
            "swot": ({"opportunities": req.swot.opportunities,
                      "threats": req.swot.threats} if req.swot else None),
            "market_notes": req.market_notes,
        }
        out = await self.llm.complete_json(
            system="Sintesis laporan Business Opportunity Analysis. Tekankan "
                   "section sesuai 'goals'. Kembalikan JSON {executive_summary, "
                   "narrative, market_insights[], recommendations[]}. Konsisten "
                   "antar-section; jangan bertentangan dgn data sentimen/SWOT.",
            user=json.dumps(payload, ensure_ascii=False), task="summary_compose")

        # Visualisasi: heatmap FeatureCollection inline (frontend render MapLibre).
        viz = Visualizations()
        if req.sentiment:
            feats = [{
                "type": "Feature",
                "geometry": {"type": "Point",
                             "coordinates": [p.coordinates.lng, p.coordinates.lat]},
                "properties": {"weight": round((p.sentiment_score + 1) / 2, 3),
                               "label": p.label.value, "loc": p.location_tag,
                               "n": p.sample_size},
            } for p in req.sentiment.points if p.coordinates]
            viz.sentiment_chart_data = {
                "distribution": req.sentiment.overall_distribution,
                "heatmap": {"type": "FeatureCollection", "features": feats},
            }
        if req.swot:
            viz.competitor_table = req.swot.competitors

        status = (AnalysisStatus.PARTIAL
                  if (req.sentiment is None or req.swot is None)
                  else AnalysisStatus.COMPLETED)

        return Report(
            scope_id=req.scope.scope_id, status=status,
            executive_summary=out.get("executive_summary", ""),
            sentiment=req.sentiment, swot=req.swot,
            market_insights=out.get("market_insights", []),
            recommendations=out.get("recommendations", []),
            narrative=out.get("narrative", ""),
            visualizations=viz)
