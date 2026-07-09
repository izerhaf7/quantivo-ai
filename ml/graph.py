"""
ml/graph.py — AGENT ORCHESTRATION LAYER (LangGraph).

Memetakan "Agent Orchestration Layer" (Bagian 3 & Tahap 4 spesifikasi) ke graph:

                 ┌─ retrieve_sentiment ─ run_sentiment ─┐
    START ──────►┤                                      ├─► run_summary ─► END
                 └─ retrieve_swot ────── run_swot ───────┘

  - Cabang Sentiment & SWOT INDEPENDEN -> LangGraph menjalankannya PARALEL
    (dua edge keluar dari START; run_summary punya dua edge masuk => ia
    menunggu KEDUA cabang selesai sebelum jalan = join alami).
  - Rerank Agent dipanggil di dalam node retrieve_* (bagian dari retrieval).
  - Graceful degradation: kalau satu cabang gagal, node menaruh hasil None +
    catatan degradasi; Summary tetap jalan dgn data parsial (Report.status=PARTIAL).

Node HANYA memanggil objek yang mematuhi Protocol di contracts/interfaces.py.
Jadi LangGraph = orkestrasi murni; logika agent tetap terisolasi & bisa di-mock.
"""
from __future__ import annotations

import operator
from typing import Annotated, Optional, TypedDict

from langgraph.graph import StateGraph, START, END

from contracts import (
    ScopeConfig, RetrievedChunk, AnalysisTrack,
    RerankRequest, SentimentResult, SWOTResult, SummaryRequest, Report,
)
from interfaces import (
    Retriever, RerankAgent, SentimentAgent, SwotAgent, SummaryAgent,
)


# ---------------------------------------------------------------------------
# STATE. Kunci yang ditulis DUA cabang paralel (degradation_notes) pakai
# reducer operator.add supaya penulisan bersamaan tidak saling menimpa.
# ---------------------------------------------------------------------------
class AgentState(TypedDict, total=False):
    scope: ScopeConfig
    sentiment_chunks: Optional[list[RetrievedChunk]]
    swot_chunks: Optional[list[RetrievedChunk]]
    market_notes: list[str]
    sentiment: Optional[SentimentResult]
    swot: Optional[SWOTResult]
    report: Optional[Report]
    degradation_notes: Annotated[list[str], operator.add]


def build_agent_graph(
    *,
    retriever: Retriever,
    rerank_agent: RerankAgent,
    sentiment_agent: SentimentAgent,
    swot_agent: SwotAgent,
    summary_agent: SummaryAgent,
    top_k_retrieve: int = 30,
    top_k_rerank: int = 15,
):
    """Factory: suntik implementasi (nyata atau mock) -> compiled graph."""

    async def _retrieve(scope: ScopeConfig, track: AnalysisTrack, query: str):
        cands = await retriever.retrieve(query, scope, track, top_k=top_k_retrieve)
        ranked = await rerank_agent.rerank(RerankRequest(
            scope=scope, track=track, candidates=cands, top_k=top_k_rerank))
        return ranked.ranked

    # ---- NODE: retrieval + rerank per cabang (dgn graceful degradation) ----
    # Kalau retriever/embedder mati (mis. Qdrant unreachable), cabang ini TIDAK
    # boleh menjatuhkan seluruh graph. Sentinel None (beda dari [] "hasil kosong
    # tapi retrieval sukses") memberi tahu run_* untuk skip pemanggilan agent.
    async def retrieve_sentiment(state: AgentState) -> AgentState:
        scope = state["scope"]
        q = f"sentimen {scope.business_input.business_type} {scope.business_input.location.city}"
        try:
            return {"sentiment_chunks": await _retrieve(scope, AnalysisTrack.SENTIMENT, q)}
        except Exception as e:  # noqa: BLE001
            return {"sentiment_chunks": None,
                    "degradation_notes": [f"Retrieval sentimen gagal: {e}"]}

    async def retrieve_swot(state: AgentState) -> AgentState:
        scope = state["scope"]
        try:
            chunks = await _retrieve(scope, AnalysisTrack.SWOT, scope.competitor_query)
            return {"swot_chunks": chunks}
        except Exception as e:  # noqa: BLE001
            return {"swot_chunks": None,
                    "degradation_notes": [f"Retrieval SWOT gagal: {e}"]}

    # ---- NODE: agent analisis (dgn graceful degradation) ----
    async def run_sentiment(state: AgentState) -> AgentState:
        chunks = state.get("sentiment_chunks")
        if chunks is None:  # retrieval sudah gagal & tercatat di retrieve_sentiment
            return {"sentiment": None}
        try:
            res = await sentiment_agent.analyze(state["scope"], chunks)
            return {"sentiment": res}
        except Exception as e:  # noqa: BLE001
            return {"sentiment": None,
                    "degradation_notes": [f"Analisis sentimen gagal: {e}"]}

    async def run_swot(state: AgentState) -> AgentState:
        chunks = state.get("swot_chunks")
        if chunks is None:  # retrieval sudah gagal & tercatat di retrieve_swot
            return {"swot": None}
        try:
            res = await swot_agent.analyze(state["scope"], chunks)
            return {"swot": res}
        except Exception as e:  # noqa: BLE001
            return {"swot": None,
                    "degradation_notes": [f"Analisis SWOT gagal: {e}"]}

    # ---- NODE: join + sintesis ----
    async def run_summary(state: AgentState) -> AgentState:
        report = await summary_agent.compose(SummaryRequest(
            scope=state["scope"],
            sentiment=state.get("sentiment"),
            swot=state.get("swot"),
            market_notes=state.get("market_notes", [])))
        report.degradation_notes = state.get("degradation_notes", [])
        return {"report": report}

    g = StateGraph(AgentState)
    g.add_node("retrieve_sentiment", retrieve_sentiment)
    g.add_node("retrieve_swot", retrieve_swot)
    g.add_node("run_sentiment", run_sentiment)
    g.add_node("run_swot", run_swot)
    g.add_node("run_summary", run_summary)

    # dua cabang dari START -> jalan paralel
    g.add_edge(START, "retrieve_sentiment")
    g.add_edge(START, "retrieve_swot")
    g.add_edge("retrieve_sentiment", "run_sentiment")
    g.add_edge("retrieve_swot", "run_swot")
    # dua edge masuk -> run_summary menunggu keduanya (join)
    g.add_edge("run_sentiment", "run_summary")
    g.add_edge("run_swot", "run_summary")
    g.add_edge("run_summary", END)

    return g.compile()


async def run_analysis(graph, scope: ScopeConfig, market_notes: list[str] | None = None) -> Report:
    """Helper: jalankan graph, kembalikan Report. Dipanggil orchestrator Razan."""
    final: AgentState = await graph.ainvoke({
        "scope": scope,
        "market_notes": market_notes or [],
        "degradation_notes": [],
    })
    return final["report"]
