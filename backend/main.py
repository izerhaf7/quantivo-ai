"""
backend/main.py — BOA SaaS FastAPI app (real running backend).

Same REST contract as contracts/api_stub.py (kept there as Indra's frontend
reference stub). This module is what actually runs.
"""
from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from contracts import (
    BusinessInput, AnalysisStatus,
    CreateAnalysisResponse, AnalysisStatusResponse, AnalysisSummary, ProgressStage,
    Report,
)
from auth import google_callback, google_start, logout, require_current_user, user_response
from orchestrator import OrchestratorImpl
from store import JobStore
from user_store import UserStore

# Explicit path, same convention as ml/llm_demo.py's ROOT_ENV -- always the
# repo-root .env regardless of CWD/how uvicorn was launched. Orchestrator
# real-wiring (FireworksLLMClient/FireworksEmbeddingClient/scraping modules)
# reads os.environ directly and does NOT load .env itself, so without this
# the real pipeline would silently run with empty API keys.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

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
    app.state.user_store = UserStore()
    app.state.orchestrator = OrchestratorImpl(app.state.store)
    yield
    await app.state.store.close()


app = FastAPI(title="BOA SaaS API", version="1.0.0", lifespan=lifespan)

_cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_store() -> JobStore:
    return app.state.store


def get_orchestrator() -> OrchestratorImpl:
    return app.state.orchestrator


def get_user_store() -> UserStore:
    return app.state.user_store


@app.get("/health")
async def health(store: JobStore = Depends(get_store)) -> dict:
    return {"status": "ok", "redis": "ok" if await store.ping() else "unreachable"}


@app.get("/auth/google/start")
async def auth_google_start(user_store: UserStore = Depends(get_user_store)):
    return google_start(user_store)


@app.get("/auth/google/callback")
async def auth_google_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    user_store: UserStore = Depends(get_user_store),
):
    return await google_callback(code, state, user_store)


@app.get("/auth/me")
async def auth_me(request: Request, user_store: UserStore = Depends(get_user_store)) -> dict:
    user = require_current_user(request, user_store)
    return {"user": user_response(user)}


@app.post("/auth/logout")
async def auth_logout(
    request: Request,
    response: Response,
    user_store: UserStore = Depends(get_user_store),
) -> dict:
    return logout(request, response, user_store)


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
    if job["status"] != AnalysisStatus.AWAITING_CONFIRMATION:
        raise HTTPException(
            409, f"analysis already {job['status'].value}, cannot confirm again")
    await store.set_status(analysis_id, AnalysisStatus.CONFIRMED)
    # TODO(arq): ganti create_task -> enqueue ke arq worker (durable). Lihat
    # docs/superpowers/specs/2026-07-10-backend-orchestrator-design.md.
    asyncio.create_task(orchestrator.run(job["scope"]))
    job["status"] = AnalysisStatus.CONFIRMED
    return await _status_response(analysis_id, store, job=job)


@app.get("/api/analyses", response_model=list[AnalysisSummary])
async def list_analyses(store: JobStore = Depends(get_store)) -> list[AnalysisSummary]:
    return await store.list_summaries()


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisStatusResponse)
async def get_status(
    analysis_id: str, store: JobStore = Depends(get_store)
) -> AnalysisStatusResponse:
    job = await store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "analysis not found")
    return await _status_response(analysis_id, store, job=job)


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


async def _status_response(
    analysis_id: str, store: JobStore, job: dict | None = None
) -> AnalysisStatusResponse:
    if job is None:
        job = await store.get(analysis_id)
    st: AnalysisStatus = job["status"]
    return AnalysisStatusResponse(
        analysis_id=analysis_id,
        status=st,
        progress=ProgressStage(status=st, pct=_STAGE_PCT[st], message=st.value),
        sections_ready=job["sections_ready"],
        error=job["error"],
    )
