"""
backend/main.py — BOA SaaS FastAPI app (real running backend).

Same REST contract as contracts/api_stub.py (kept there as Indra's frontend
reference stub). This module is what actually runs. Job storage and pipeline
wiring are filled in by later tasks (see store.py, orchestrator.py).
"""
from __future__ import annotations

import asyncio
from datetime import timedelta

from fastapi import FastAPI, HTTPException

from contracts import (
    _now, BusinessInput, ScopeConfig, AnalysisStatus,
    CreateAnalysisResponse, AnalysisStatusResponse, ProgressStage,
    Report, Visualizations,
)

app = FastAPI(title="BOA SaaS API", version="1.0.0")

# In-memory store for this task only — replaced by JobStore (Redis) in Task 2.
_JOBS: dict[str, dict] = {}

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
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/analyses", response_model=CreateAnalysisResponse)
async def create_analysis(inp: BusinessInput) -> CreateAnalysisResponse:
    scope = _build_scope(inp)
    _JOBS[scope.scope_id] = {"status": AnalysisStatus.AWAITING_CONFIRMATION,
                             "scope": scope, "report": None}
    return CreateAnalysisResponse(
        analysis_id=scope.scope_id,
        status=AnalysisStatus.AWAITING_CONFIRMATION,
        scope=scope,
    )


@app.post("/api/analyses/{analysis_id}/confirm", response_model=AnalysisStatusResponse)
async def confirm_analysis(analysis_id: str) -> AnalysisStatusResponse:
    job = _JOBS.get(analysis_id)
    if not job:
        raise HTTPException(404, "analysis not found")
    job["status"] = AnalysisStatus.CONFIRMED
    # TODO(arq): ganti create_task -> enqueue ke arq worker (durable). Lihat
    # docs/superpowers/specs/2026-07-10-backend-orchestrator-design.md.
    asyncio.create_task(_run_pipeline(analysis_id))
    return _status_response(analysis_id)


@app.get("/api/analyses/{analysis_id}", response_model=AnalysisStatusResponse)
async def get_status(analysis_id: str) -> AnalysisStatusResponse:
    if analysis_id not in _JOBS:
        raise HTTPException(404, "analysis not found")
    return _status_response(analysis_id)


@app.get("/api/analyses/{analysis_id}/report", response_model=Report)
async def get_report(analysis_id: str) -> Report:
    job = _JOBS.get(analysis_id)
    if not job:
        raise HTTPException(404, "analysis not found")
    if not job["report"]:
        raise HTTPException(409, "report belum siap; polling status dulu")
    return job["report"]


def _status_response(analysis_id: str) -> AnalysisStatusResponse:
    job = _JOBS[analysis_id]
    st: AnalysisStatus = job["status"]
    return AnalysisStatusResponse(
        analysis_id=analysis_id,
        status=st,
        progress=ProgressStage(status=st, pct=_STAGE_PCT[st], message=st.value),
        sections_ready=job.get("sections_ready", []),
    )


async def _run_pipeline(analysis_id: str) -> None:
    job = _JOBS[analysis_id]
    scope: ScopeConfig = job["scope"]
    try:
        for stage in (AnalysisStatus.SCRAPING, AnalysisStatus.ROUTING,
                      AnalysisStatus.PREPROCESSING, AnalysisStatus.INDEXING):
            job["status"] = stage
            await asyncio.sleep(0.3)

        job["status"] = AnalysisStatus.ANALYZING
        await asyncio.sleep(0.5)
        job["sections_ready"] = ["sentiment", "swot"]

        job["status"] = AnalysisStatus.COMPOSING
        await asyncio.sleep(0.3)

        job["report"] = Report(
            scope_id=scope.scope_id,
            status=AnalysisStatus.COMPLETED,
            executive_summary="(dummy) ringkasan eksekutif",
            market_insights=["(dummy) insight pasar"],
            recommendations=["(dummy) rekomendasi"],
            narrative="(dummy) narasi laporan",
            visualizations=Visualizations(),
        )
        job["status"] = AnalysisStatus.COMPLETED
    except Exception as e:                       # noqa: BLE001
        job["status"] = AnalysisStatus.FAILED
        job["error"] = str(e)
