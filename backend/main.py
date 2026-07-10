"""
backend/main.py — BOA SaaS FastAPI app (real running backend).

Same REST contract as contracts/api_stub.py (kept there as Indra's frontend
reference stub). This module is what actually runs.
"""
from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException

from contracts import (
    BusinessInput, AnalysisStatus,
    CreateAnalysisResponse, AnalysisStatusResponse, ProgressStage,
    Report,
)
from orchestrator import OrchestratorImpl
from store import JobStore

_STAGE_PCT = {
    AnalysisStatus.AWAITING_CONFIRMATION: 0,
    AnalysisStatus.CONFIRMED: 5,
    AnalysisStatus.SCRAPING: 20,
    AnalysisStatus.ROUTING: 35,
    AnalysisStatus.PREPROCESSING: 45,
    AnalysisStatus.INDEXING: 55,
    AnalysisStatus.ANALYZING: 80,
    AnalysisStatus.COMPOSING: 95,
    AnalysisStatus.COMPLETED: 100,
    AnalysisStatus.PARTIAL: 100,
    AnalysisStatus.FAILED: 100,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    app.state.store = JobStore(redis_url)
    app.state.orchestrator = OrchestratorImpl(app.state.store)
    yield
    await app.state.store.close()


app = FastAPI(title="BOA SaaS API", version="1.0.0", lifespan=lifespan)


def get_store() -> JobStore:
    return app.state.store


def get_orchestrator() -> OrchestratorImpl:
    return app.state.orchestrator


@app.get("/health")
async def health(store: JobStore = Depends(get_store)) -> dict:
    return {"status": "ok", "redis": "ok" if await store.ping() else "unreachable"}


@app.post("/api/analyses", response_model=CreateAnalysisResponse)
async def create_analysis(
    inp: BusinessInput,
    store: JobStore = Depends(get_store),
    orchestrator: OrchestratorImpl = Depends(get_orchestrator),
) -> CreateAnalysisResponse:
    scope = await orchestrator.create_scope(inp)
    await store.create(scope)
    return CreateAnalysisResponse(
        analysis_id=scope.scope_id,
        status=AnalysisStatus.AWAITING_CONFIRMATION,
        scope=scope,
    )


@app.post("/api/analyses/{analysis_id}/confirm", response_model=AnalysisStatusResponse)
async def confirm_analysis(
    analysis_id: str,
    store: JobStore = Depends(get_store),
    orchestrator: OrchestratorImpl = Depends(get_orchestrator),
) -> AnalysisStatusResponse:
    job = await store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "analysis not found")
    await store.set_status(analysis_id, AnalysisStatus.CONFIRMED)
    # TODO(arq): ganti create_task -> enqueue ke arq worker (durable). Lihat
    # docs/superpowers/specs/2026-07-10-backend-orchestrator-design.md.
    asyncio.create_task(orchestrator.run(job["scope"]))
    return await _status_response(analysis_id, store)


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisStatusResponse)
async def get_status(
    analysis_id: str, store: JobStore = Depends(get_store)
) -> AnalysisStatusResponse:
    job = await store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "analysis not found")
    return await _status_response(analysis_id, store)


@app.get("/api/analyses/{analysis_id}/report", response_model=Report)
async def get_report(
    analysis_id: str, store: JobStore = Depends(get_store)
) -> Report:
    job = await store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "analysis not found")
    if job["report"] is None:
        raise HTTPException(409, "report belum siap; polling status dulu")
    return job["report"]


async def _status_response(analysis_id: str, store: JobStore) -> AnalysisStatusResponse:
    job = await store.get(analysis_id)
    st: AnalysisStatus = job["status"]
    return AnalysisStatusResponse(
        analysis_id=analysis_id,
        status=st,
        progress=ProgressStage(status=st, pct=_STAGE_PCT[st], message=st.value),
        sections_ready=job["sections_ready"],
    )
