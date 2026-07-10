"""
backend/main.py — BOA SaaS FastAPI app (real running backend).

Same REST contract as contracts/api_stub.py (kept there as Indra's frontend
reference stub). This module is what actually runs.
"""
from __future__ import annotations

import asyncio
import os
from contextlib import asynccontextmanager
from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException

from contracts import (
    _now, BusinessInput, ScopeConfig, AnalysisStatus,
    CreateAnalysisResponse, AnalysisStatusResponse, ProgressStage,
    Report, Visualizations,
)
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

_STAGE_VERB = {
    "idea": "memvalidasi peluang",
    "new": "menganalisis posisi",
    "established": "menganalisis peluang pertumbuhan",
    "expanding": "menilai ekspansi",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    app.state.store = JobStore(redis_url)
    yield
    await app.state.store.close()


app = FastAPI(title="BOA SaaS API", version="1.0.0", lifespan=lifespan)


def get_store() -> JobStore:
    return app.state.store


def _build_scope(inp: BusinessInput) -> ScopeConfig:
    loc = inp.location
    where = loc.district or loc.city
    verb = _STAGE_VERB.get(inp.business_stage.value, "menganalisis")

    keywords = [inp.business_type, f"{inp.business_type} {loc.city}"]
    for tc in inp.target_customers:
        keywords.append(f"{inp.business_type} {tc.value}")

    goals_txt = ", ".join(g.value for g in inp.primary_goals) or "analisis peluang umum"
    return ScopeConfig(
        business_input=inp,
        interpreted_summary=(
            f"Kami akan {verb} {inp.business_type} dalam radius {inp.radius_km:g}km "
            f"dari {where}, dengan fokus: {goals_txt}. Termasuk kompetitor lokal "
            f"dan sentimen area sekitarnya."
        ),
        search_keywords=keywords,
        competitor_query=f"{inp.business_type} {where}",
        expires_at=_now() + timedelta(hours=48),
    )


@app.get("/health")
async def health(store: JobStore = Depends(get_store)) -> dict:
    return {"status": "ok", "redis": "ok" if await store.ping() else "unreachable"}


@app.post("/api/analyses", response_model=CreateAnalysisResponse)
async def create_analysis(
    inp: BusinessInput, store: JobStore = Depends(get_store)
) -> CreateAnalysisResponse:
    scope = _build_scope(inp)
    await store.create(scope)
    return CreateAnalysisResponse(
        analysis_id=scope.scope_id,
        status=AnalysisStatus.AWAITING_CONFIRMATION,
        scope=scope,
    )


@app.post("/api/analyses/{analysis_id}/confirm", response_model=AnalysisStatusResponse)
async def confirm_analysis(
    analysis_id: str, store: JobStore = Depends(get_store)
) -> AnalysisStatusResponse:
    job = await store.get(analysis_id)
    if job is None:
        raise HTTPException(404, "analysis not found")
    await store.set_status(analysis_id, AnalysisStatus.CONFIRMED)
    # TODO(arq): ganti create_task -> enqueue ke arq worker (durable). Lihat
    # docs/superpowers/specs/2026-07-10-backend-orchestrator-design.md.
    asyncio.create_task(_run_pipeline(analysis_id, job["scope"], store))
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


async def _run_pipeline(analysis_id: str, scope: ScopeConfig, store: JobStore) -> None:
    """Dummy pipeline for this task only — replaced by OrchestratorImpl.run() in Task 3."""
    try:
        for stage in (AnalysisStatus.SCRAPING, AnalysisStatus.ROUTING,
                      AnalysisStatus.PREPROCESSING, AnalysisStatus.INDEXING):
            await store.set_status(analysis_id, stage)
            await asyncio.sleep(0.3)

        await store.set_status(analysis_id, AnalysisStatus.ANALYZING)
        await asyncio.sleep(0.5)
        await store.set_sections_ready(analysis_id, ["sentiment", "swot"])

        await store.set_status(analysis_id, AnalysisStatus.COMPOSING)
        await asyncio.sleep(0.3)

        await store.set_report(analysis_id, Report(
            scope_id=scope.scope_id,
            status=AnalysisStatus.COMPLETED,
            executive_summary="(dummy) ringkasan eksekutif",
            market_insights=["(dummy) insight pasar"],
            recommendations=["(dummy) rekomendasi"],
            narrative="(dummy) narasi laporan",
            visualizations=Visualizations(),
        ))
        await store.set_status(analysis_id, AnalysisStatus.COMPLETED)
    except Exception as e:                       # noqa: BLE001
        await store.set_status(analysis_id, AnalysisStatus.FAILED)
        await store.set_error(analysis_id, str(e))
