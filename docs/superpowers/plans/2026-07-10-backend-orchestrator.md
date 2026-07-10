# Backend Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill the placeholder `backend/` package with a real `Orchestrator` (`contracts/interfaces.py`) implementation, replacing the dummy sleep-based pipeline in `contracts/api_stub.py`, wired end-to-end and runnable fully offline.

**Architecture:** FastAPI app (`backend/main.py`) backed by a Redis job store (`backend/store.py`) and an `OrchestratorImpl` (`backend/orchestrator.py`) that wires `ml/`'s real `DataRouter` → `chunking.chunks_from_routed` → a per-job `MockRetriever` (`backend/mocks.py`) → `ml/graph.py`'s `build_agent_graph`/`run_analysis`, all through `contracts/interfaces.py` Protocol types. Scraper stand-in reads `fixtures/raw_data_items.sample.json` until `scraping/` exists.

**Tech Stack:** FastAPI, `redis.asyncio` (redis-py ≥5.2), LangGraph (via `ml/graph.py`), httpx (demo client), `uv` for dependency/run management.

## Global Constraints

- Do not modify `contracts/contracts.py`, `contracts/interfaces.py`, `contracts/api_stub.py`, anything under `ml/`, `frontend/`, or `scraping/`. Only create/modify files under `backend/` and `pyproject.toml` (one dependency line).
- `contracts/` and `ml/` are not installable packages — every run command needs `PYTHONPATH` to include them (`contracts:ml` on macOS/Linux, `contracts;ml` on Windows), exactly like the existing `ml/run_demo.py` convention in `CLAUDE.md`.
- `backend/` follows the same flat-module convention as `ml/` (no relative imports between `backend/*.py` files) so `--app-dir backend` (uvicorn) and direct `python backend/run_demo.py` both work without a package-import mismatch. `backend/__init__.py` exists only as a marker file, per the original request.
- arq is explicitly out of scope for this branch — `asyncio.create_task` stays, marked with a `TODO(arq)` comment at the call site.
- No automated test suite exists in this repo (per `CLAUDE.md`) and this branch does not introduce one — verification is manual (uvicorn + curl/PowerShell, or a runnable demo script), mirroring `ml/run_demo.py`'s pattern.
- Branch: `razan/backend-skeleton`. Commit after each task with a clear message. Do not push to any remote. Explain each commit's diff to the user before starting the next task.
- New dependency: `"redis>=5.2"` in `pyproject.toml` (`redis.asyncio` submodule). No other new dependencies (httpx is already present).

---

## File Structure

```
backend/
  __init__.py     # marker only
  main.py         # FastAPI app: endpoints, lifespan (JobStore + OrchestratorImpl), /health
  store.py        # JobStore: Redis-backed job/state store (boa:job:{scope_id} hash + TTL)
  orchestrator.py # OrchestratorImpl(interfaces.Orchestrator): create_scope + run
  mocks.py        # MockRetriever(interfaces.Retriever): offline per-job retrieval
  run_demo.py     # manual end-to-end demo: exercises main.py's REST API in-process
pyproject.toml    # + "redis>=5.2"
```

---

### Task 1: Scaffold `backend/main.py` (dummy pipeline, liveness health)

**Files:**
- Create: `backend/__init__.py`
- Create: `backend/main.py`

**Interfaces:**
- Produces: FastAPI `app` object at module path `main:app` (via `--app-dir backend`), with routes `POST /api/analyses`, `POST /api/analyses/{analysis_id}/confirm`, `GET /api/analyses/{analysis_id}`, `GET /api/analyses/{analysis_id}/report`, `GET /health`.

- [ ] **Step 1: Create `backend/__init__.py`**

```python
"""backend package — BOA SaaS orchestration + REST API (Razan)."""
```

- [ ] **Step 2: Create `backend/main.py`** — this is a straight copy of `contracts/api_stub.py`'s endpoint logic into `backend/`, plus a liveness-only `/health`. It still uses the dummy sleep-based pipeline; that gets replaced in Task 3.

```python
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
```

- [ ] **Step 3: Verify it runs**

Run (from repo root):

```bash
# macOS/Linux
PYTHONPATH=contracts uv run uvicorn main:app --app-dir backend --port 8001
# Windows
PYTHONPATH="contracts" uv run uvicorn main:app --app-dir backend --port 8001
```

In another terminal:

```bash
curl http://localhost:8001/health
```

Expected: `{"status":"ok"}`.

```bash
curl -X POST http://localhost:8001/api/analyses -H "Content-Type: application/json" -d "{\"business_type\":\"Kedai kopi\",\"description\":\"manual brew\",\"location\":{\"city\":\"Cikarang\"},\"category\":\"food_beverage\",\"business_stage\":\"idea\"}"
```

Expected: HTTP 200, JSON body with `"status":"awaiting_confirmation"` and a `scope.scope_id`. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 4: Commit**

```bash
git checkout -b razan/backend-skeleton
git add backend/__init__.py backend/main.py
git commit -m "$(cat <<'EOF'
feat(backend): scaffold FastAPI app with dummy pipeline

Move api_stub.py's endpoint logic into backend/main.py (the app that
actually runs; contracts/api_stub.py stays as Indra's frontend-facing
reference). Adds a liveness-only GET /health. Job storage is still the
in-memory dict and the pipeline still sleeps — replaced in the next
two commits.
EOF
)"
```

---

### Task 2: `backend/store.py` — Redis-backed `JobStore`

**Files:**
- Create: `backend/store.py`
- Modify: `pyproject.toml` (add `"redis>=5.2"` to `dependencies`)
- Modify: `backend/main.py` (replace `_JOBS` dict with `JobStore`, add Redis ping to `/health`)

**Interfaces:**
- Consumes: `contracts.AnalysisStatus`, `contracts.Report`, `contracts.ScopeConfig` (all `.model_dump_json()` / `.model_validate_json()`).
- Produces (for Task 3 and `main.py`): `JobStore(redis_url: str)` with async methods `create(scope: ScopeConfig) -> None`, `get(scope_id: str) -> dict | None` (keys: `status: AnalysisStatus`, `scope: ScopeConfig`, `report: Report | None`, `sections_ready: list[str]`, `error: str | None`), `get_status(scope_id: str) -> AnalysisStatus | None`, `set_status(scope_id: str, status: AnalysisStatus) -> None`, `set_sections_ready(scope_id: str, sections: list[str]) -> None`, `set_report(scope_id: str, report: Report) -> None`, `set_error(scope_id: str, message: str) -> None`, `ping() -> bool`, `close() -> None`.

- [ ] **Step 1: Add the `redis` dependency**

Edit `pyproject.toml` — add `"redis>=5.2",` to the `dependencies` list (after `"python-dotenv>=1.0",`):

```toml
dependencies = [
    "pydantic>=2.13",
    "fastapi>=0.136",
    "uvicorn>=0.47",
    "httpx>=0.28",
    "langgraph>=1.2.8",
    "qdrant-client>=1.11",
    "python-dotenv>=1.0",
    "redis>=5.2",
]
```

Run: `uv sync` — expected: resolves and installs `redis` into `.venv` with no errors.

- [ ] **Step 2: Create `backend/store.py`**

```python
"""
backend/store.py — JobStore: Redis-backed job/state store.

Replaces the in-memory _JOBS dict from the scaffold. One Redis hash per job
at key boa:job:{scope_id}, fields: status, scope (JSON), expires_at (ISO),
report (JSON or ""), sections_ready (JSON list), error (str or "").

TTL mirrors ScopeConfig.expires_at (48h buffer per spec) and is refreshed on
every write so an in-flight job doesn't expire mid-pipeline.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import redis.asyncio as redis

from contracts import AnalysisStatus, Report, ScopeConfig


def _key(scope_id: str) -> str:
    return f"boa:job:{scope_id}"


class JobStore:
    def __init__(self, redis_url: str):
        self._redis = redis.Redis.from_url(redis_url, decode_responses=True)

    async def close(self) -> None:
        await self._redis.aclose()

    async def ping(self) -> bool:
        try:
            return bool(await self._redis.ping())
        except Exception:  # noqa: BLE001
            return False

    async def create(self, scope: ScopeConfig) -> None:
        key = _key(scope.scope_id)
        await self._redis.hset(key, mapping={
            "status": AnalysisStatus.AWAITING_CONFIRMATION.value,
            "scope": scope.model_dump_json(),
            "expires_at": scope.expires_at.isoformat(),
            "report": "",
            "sections_ready": json.dumps([]),
            "error": "",
        })
        await self._refresh_ttl(scope.scope_id)

    async def get(self, scope_id: str) -> dict | None:
        data = await self._redis.hgetall(_key(scope_id))
        if not data:
            return None
        return {
            "status": AnalysisStatus(data["status"]),
            "scope": ScopeConfig.model_validate_json(data["scope"]),
            "report": Report.model_validate_json(data["report"]) if data.get("report") else None,
            "sections_ready": json.loads(data.get("sections_ready") or "[]"),
            "error": data.get("error") or None,
        }

    async def get_status(self, scope_id: str) -> AnalysisStatus | None:
        status = await self._redis.hget(_key(scope_id), "status")
        return AnalysisStatus(status) if status else None

    async def set_status(self, scope_id: str, status: AnalysisStatus) -> None:
        await self._redis.hset(_key(scope_id), "status", status.value)
        await self._refresh_ttl(scope_id)

    async def set_sections_ready(self, scope_id: str, sections: list[str]) -> None:
        await self._redis.hset(_key(scope_id), "sections_ready", json.dumps(sections))
        await self._refresh_ttl(scope_id)

    async def set_report(self, scope_id: str, report: Report) -> None:
        await self._redis.hset(_key(scope_id), "report", report.model_dump_json())
        await self._refresh_ttl(scope_id)

    async def set_error(self, scope_id: str, message: str) -> None:
        await self._redis.hset(_key(scope_id), "error", message)
        await self._refresh_ttl(scope_id)

    async def _refresh_ttl(self, scope_id: str) -> None:
        expires_raw = await self._redis.hget(_key(scope_id), "expires_at")
        if not expires_raw:
            return
        expires_at = datetime.fromisoformat(expires_raw)
        ttl_seconds = int((expires_at - datetime.now(timezone.utc)).total_seconds())
        if ttl_seconds > 0:
            await self._redis.expire(_key(scope_id), ttl_seconds)
```

- [ ] **Step 3: Wire `backend/main.py` to `JobStore`**

Replace the top of `backend/main.py` (imports through `_STAGE_VERB`) with:

```python
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
```

Replace `def _build_scope(...)` — unchanged, keep as-is (still module-level in this task; Task 3 moves it into `orchestrator.py`).

Replace the `/health` endpoint:

```python
@app.get("/health")
async def health(store: JobStore = Depends(get_store)) -> dict:
    return {"status": "ok", "redis": "ok" if await store.ping() else "unreachable"}
```

Replace `create_analysis`, `confirm_analysis`, `get_status`, `get_report`, `_status_response`, and `_run_pipeline` with:

```python
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
```

- [ ] **Step 4: Verify it runs against real Redis**

Start Redis (skip if you already have one running locally):

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

In another terminal, from repo root:

```bash
# macOS/Linux
PYTHONPATH=contracts uv run uvicorn main:app --app-dir backend --port 8001
# Windows
PYTHONPATH="contracts" uv run uvicorn main:app --app-dir backend --port 8001
```

```bash
curl http://localhost:8001/health
```

Expected: `{"status":"ok","redis":"ok"}`. Stop Redis (Ctrl+C in its terminal) and re-run `curl http://localhost:8001/health` — expected: `{"status":"ok","redis":"unreachable"}`. Restart Redis, repeat the create/confirm/poll flow from Task 1 Step 3 — expected: same behavior as before, but job state now survives an app restart (kill and restart uvicorn mid-poll, `GET /api/analyses/{id}` still returns the last known status).

- [ ] **Step 5: Commit**

```bash
git add backend/store.py backend/main.py pyproject.toml uv.lock
git commit -m "$(cat <<'EOF'
feat(backend): add Redis-backed JobStore, replace in-memory _JOBS

JobStore (backend/store.py) persists job state as a Redis hash per
scope_id with TTL mirroring ScopeConfig.expires_at (refreshed on every
write). main.py now depends on JobStore instead of the in-memory dict,
and GET /health reports Redis reachability. Pipeline is still dummy
sleeps — replaced in the next commit.
EOF
)"
```

---

### Task 3: `backend/orchestrator.py` + `backend/mocks.py` — real pipeline wiring

**Files:**
- Create: `backend/mocks.py`
- Create: `backend/orchestrator.py`
- Modify: `backend/main.py` (delegate `create_scope`/pipeline execution to `OrchestratorImpl`, remove dummy `_run_pipeline` and module-level `_build_scope`/`_STAGE_VERB`)

**Interfaces:**
- Consumes: `JobStore` (Task 2); `interfaces.Retriever`/`interfaces.Orchestrator` (`contracts/interfaces.py`); `router.DataRouter`, `chunking.chunks_from_routed`, `embeddings.MockEmbeddingClient`, `llm.MockLLMClient`, `agents.HeuristicRerankAgent`/`SentimentAgentImpl`/`SwotAgentImpl`/`SummaryAgentImpl`, `graph.build_agent_graph`/`run_analysis` (all `ml/*.py`, flat-imported).
- Produces: `MockRetriever(chunks: list[Chunk])` implementing `interfaces.Retriever` (`ingest`, `retrieve`). `OrchestratorImpl(store: JobStore)` implementing `interfaces.Orchestrator`: `async def create_scope(self, inp: BusinessInput) -> ScopeConfig`, `async def run(self, scope: ScopeConfig) -> Report`.

- [ ] **Step 1: Create `backend/mocks.py`**

A fresh instance is built per pipeline run (see `orchestrator.py` below) rather than shared across jobs — sharing one mutable `MockRetriever` across concurrent analyses would let one job's chunks leak into another's retrieval results if two runs interleave on the event loop.

```python
"""
backend/mocks.py — offline default Retriever (interfaces.Retriever).

Holds the Chunks for ONE pipeline run. A new instance is constructed per
job in orchestrator.py — never shared across concurrent analyses, since
retrieve() has no scope-filtering of its own (mirrors ml/run_demo.py's
inline MockRetriever). Swap point for production: ml/retriever.py's
QdrantRetriever.
"""
from __future__ import annotations

from contracts import AnalysisTrack, Chunk, RetrievedChunk, ScopeConfig


class MockRetriever:
    def __init__(self, chunks: list[Chunk]):
        self.chunks = chunks

    async def ingest(self, chunks: list[Chunk]) -> int:
        self.chunks.extend(chunks)
        return len(chunks)

    async def retrieve(
        self, query: str, scope: ScopeConfig, track: AnalysisTrack, top_k: int = 30
    ) -> list[RetrievedChunk]:
        hits = [c for c in self.chunks if c.track == track][:top_k]
        return [RetrievedChunk(chunk=c, dense_score=0.7, sparse_score=0.3) for c in hits]
```

- [ ] **Step 2: Create `backend/orchestrator.py`**

```python
"""
backend/orchestrator.py — OrchestratorImpl(interfaces.Orchestrator).

Wires SCRAPING -> ROUTING -> PREPROCESSING -> INDEXING -> ANALYZING ->
COMPOSING to real ml/ implementations via the Protocols in
contracts/interfaces.py, writing progress to JobStore as it goes. Default
wiring is fully offline (Mock*Client), per CLAUDE.md's mock-first
convention. Scraper stand-in reads fixtures/raw_data_items.sample.json
until scraping/ has a real implementation.

Rerank/Sentiment/SWOT/Summary agents are stateless and built once in
__init__. The retriever (and the graph that closes over it) is rebuilt
per run() call, since MockRetriever holds per-job chunk state — see
mocks.py for why it must not be shared across concurrent jobs.
"""
from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path

from contracts import (
    _now, AnalysisStatus, AnalysisTrack, BusinessInput, RawDataItem, Report,
    RouterConfig, ScopeConfig,
)
from agents import (
    HeuristicRerankAgent, SentimentAgentImpl, SummaryAgentImpl, SwotAgentImpl,
)
from chunking import chunks_from_routed
from embeddings import MockEmbeddingClient
from graph import build_agent_graph, run_analysis
from llm import MockLLMClient
from router import DataRouter

from mocks import MockRetriever
from store import JobStore

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures" / "raw_data_items.sample.json"

_STAGE_VERB = {
    "idea": "memvalidasi peluang",
    "new": "menganalisis posisi",
    "established": "menganalisis peluang pertumbuhan",
    "expanding": "menilai ekspansi",
}


class OrchestratorImpl:
    """Mematuhi interfaces.Orchestrator. Default wiring: semua Mock* (offline)."""

    def __init__(self, store: JobStore):
        self.store = store
        llm = MockLLMClient()
        self._rerank_agent = HeuristicRerankAgent()
        self._sentiment_agent = SentimentAgentImpl(llm)
        self._swot_agent = SwotAgentImpl(llm)
        self._summary_agent = SummaryAgentImpl(llm)

    async def create_scope(self, inp: BusinessInput) -> ScopeConfig:
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

    async def run(self, scope: ScopeConfig) -> Report:
        try:
            await self.store.set_status(scope.scope_id, AnalysisStatus.SCRAPING)
            items = self._load_scraped_items(scope)

            await self.store.set_status(scope.scope_id, AnalysisStatus.ROUTING)
            router = DataRouter(embedder=MockEmbeddingClient())
            routed = await router.route(items, scope, RouterConfig())

            await self.store.set_status(scope.scope_id, AnalysisStatus.PREPROCESSING)
            chunks = chunks_from_routed(routed)
            market_notes = [c.text for c in chunks if c.track == AnalysisTrack.MARKET]

            await self.store.set_status(scope.scope_id, AnalysisStatus.INDEXING)
            graph = build_agent_graph(
                retriever=MockRetriever(chunks),
                rerank_agent=self._rerank_agent,
                sentiment_agent=self._sentiment_agent,
                swot_agent=self._swot_agent,
                summary_agent=self._summary_agent,
            )

            # ANALYZING and COMPOSING collapse into one graph.ainvoke() call
            # (run_summary is a node in the same graph, not a separate await
            # point) — status still transitions through both values so
            # frontend polling sees the same stage sequence as the dummy
            # pipeline did.
            await self.store.set_status(scope.scope_id, AnalysisStatus.ANALYZING)
            report = await run_analysis(graph, scope, market_notes=market_notes)

            sections = [name for name, val in
                        (("sentiment", report.sentiment), ("swot", report.swot))
                        if val is not None]
            await self.store.set_sections_ready(scope.scope_id, sections)

            await self.store.set_status(scope.scope_id, AnalysisStatus.COMPOSING)
            await self.store.set_report(scope.scope_id, report)
            await self.store.set_status(scope.scope_id, report.status)
            return report
        except Exception as e:                       # noqa: BLE001
            await self.store.set_status(scope.scope_id, AnalysisStatus.FAILED)
            await self.store.set_error(scope.scope_id, str(e))
            failed_report = Report(
                scope_id=scope.scope_id,
                status=AnalysisStatus.FAILED,
                executive_summary="",
                degradation_notes=[f"Pipeline gagal: {e}"],
            )
            await self.store.set_report(scope.scope_id, failed_report)
            return failed_report

    @staticmethod
    def _load_scraped_items(scope: ScopeConfig) -> list[RawDataItem]:
        raw = json.loads(FIXTURES.read_text(encoding="utf-8"))
        return [RawDataItem(**d).model_copy(update={"scope_id": scope.scope_id}) for d in raw]
```

- [ ] **Step 3: Wire `backend/main.py` to `OrchestratorImpl`**

Remove `_build_scope` and `_STAGE_VERB` from `backend/main.py` (now owned by `orchestrator.py`). Add the import and lifespan wiring — replace the `lifespan`/`app`/`get_store` block with:

```python
from orchestrator import OrchestratorImpl


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
```

Replace `create_analysis` and `confirm_analysis`, and delete `_run_pipeline` entirely:

```python
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
```

`get_status`, `get_report`, and `_status_response` stay as they were in Task 2 (they already go through `store`, not `_run_pipeline`).

Also remove the now-unused `from datetime import timedelta` and `_now` import from `backend/main.py`'s top (both only existed for the old `_build_scope`) — keep the rest of the `from contracts import (...)` line as-is minus those two names.

- [ ] **Step 4: Verify the real pipeline runs end-to-end**

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

```bash
# macOS/Linux
PYTHONPATH=contracts:ml uv run uvicorn main:app --app-dir backend --port 8001
# Windows
PYTHONPATH="contracts;ml" uv run uvicorn main:app --app-dir backend --port 8001
```

Repeat the create → confirm → poll flow from Task 1 Step 3. Expected: `GET /api/analyses/{id}` transitions through `scraping` → `routing` → `preprocessing` → `indexing` → `analyzing` → `composing` → `completed` (or `partial`) over a few hundred milliseconds to a couple seconds (real LangGraph + Mock agents, not sleeps). `GET /api/analyses/{id}/report` then returns a `Report` with non-empty `executive_summary`, and `sentiment`/`swot` populated (not the old `"(dummy)"` placeholders).

- [ ] **Step 5: Commit**

```bash
git add backend/orchestrator.py backend/mocks.py backend/main.py
git commit -m "$(cat <<'EOF'
feat(backend): wire OrchestratorImpl to real ml/ pipeline

OrchestratorImpl (backend/orchestrator.py) implements
interfaces.Orchestrator, wiring DataRouter -> chunking -> a per-job
MockRetriever (backend/mocks.py) -> build_agent_graph/run_analysis,
all offline (Mock*Client) by default. main.py's confirm endpoint now
runs the real pipeline instead of sleeps; create_scope logic moved
from main.py into OrchestratorImpl.
EOF
)"
```

---

### Task 4: `backend/run_demo.py` — end-to-end proof

**Files:**
- Create: `backend/run_demo.py`

**Interfaces:**
- Consumes: `main.app`, `main.lifespan` (Task 3).

- [ ] **Step 1: Create `backend/run_demo.py`**

```python
"""
backend/run_demo.py — proof that main.py + store.py + orchestrator.py work
together through the real REST API, in-process (no network) via
httpx.ASGITransport, mirroring ml/run_demo.py's demo style.

Prerequisite: a reachable Redis (e.g. `docker run --rm -p 6379:6379
redis:7-alpine`), or set REDIS_URL to point elsewhere.

Run:
  # macOS/Linux
  PYTHONPATH=contracts:ml uv run python backend/run_demo.py
  # Windows
  PYTHONPATH="contracts;ml" uv run python backend/run_demo.py
"""
from __future__ import annotations

import asyncio

import httpx

from contracts import (
    AnalysisStatus, BusinessInput, BusinessStage, IndustryCategory, Location,
    PrimaryGoal, TargetCustomer,
)
from main import app, lifespan

_TERMINAL = {AnalysisStatus.COMPLETED.value, AnalysisStatus.PARTIAL.value,
             AnalysisStatus.FAILED.value}


async def main() -> None:
    inp = BusinessInput(
        business_type="Kedai kopi specialty",
        description="Kopi manual brew + ruang kerja",
        location=Location(city="Cikarang", district="Cikarang Selatan", province="Jawa Barat"),
        category=IndustryCategory.FOOD_BEVERAGE, radius_km=3,
        business_stage=BusinessStage.IDEA,
        primary_goals=[PrimaryGoal.VALIDATE_IDEA, PrimaryGoal.KNOW_COMPETITORS],
        target_customers=[TargetCustomer.OFFICE_WORKERS, TargetCustomer.STUDENTS],
    )

    async with lifespan(app):  # manually drive startup/shutdown — ASGITransport doesn't
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/health")
            print("HEALTH       :", r.json())

            r = await client.post("/api/analyses", json=inp.model_dump(mode="json"))
            r.raise_for_status()
            created = r.json()
            analysis_id = created["analysis_id"]
            print("CREATED      :", analysis_id)
            print("SCOPE SUMMARY:", created["scope"]["interpreted_summary"])

            r = await client.post(f"/api/analyses/{analysis_id}/confirm")
            r.raise_for_status()
            print("CONFIRMED    : status =", r.json()["status"])

            while True:
                r = await client.get(f"/api/analyses/{analysis_id}")
                r.raise_for_status()
                status_resp = r.json()
                print("POLL         :", status_resp["status"],
                      f"{status_resp['progress']['pct']}%")
                if status_resp["status"] in _TERMINAL:
                    break
                await asyncio.sleep(0.1)

            r = await client.get(f"/api/analyses/{analysis_id}/report")
            r.raise_for_status()
            report = r.json()
            print("=" * 68)
            print("STATUS       :", report["status"])
            print("EXEC SUMMARY :", report["executive_summary"])
            print("SENTIMENT    :",
                  report["sentiment"]["overall_distribution"] if report["sentiment"] else None)
            print("SWOT opps    :", report["swot"]["opportunities"] if report["swot"] else None)
            print("RECOMMENDS   :", report["recommendations"])
            print("DEGRADATION  :", report["degradation_notes"] or "(tidak ada)")
            print("=" * 68)


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: Run it**

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

In another terminal, from repo root:

```bash
# macOS/Linux
PYTHONPATH=contracts:ml uv run python backend/run_demo.py
# Windows
PYTHONPATH="contracts;ml" uv run python backend/run_demo.py
```

Expected: exits 0, prints `HEALTH : {'status': 'ok', 'redis': 'ok'}`, a `CREATED`/`SCOPE SUMMARY` line, a `CONFIRMED` line, several `POLL` lines ending in `completed 100%` or `partial 100%` (not `failed`), then a final block where `STATUS` is `completed` or `partial`, `EXEC SUMMARY` is non-empty, and `SENTIMENT`/`SWOT opps` are not `None`. Report the actual printed output back to the user (this is the "explain what changed" step for this commit, per the earlier documentation preference).

- [ ] **Step 3: Commit**

```bash
git add backend/run_demo.py
git commit -m "$(cat <<'EOF'
test(backend): add end-to-end demo script for the real pipeline

Mirrors ml/run_demo.py's style: exercises the actual REST API
(main.py + store.py + orchestrator.py) in-process via
httpx.ASGITransport, driving lifespan manually. Requires a reachable
Redis. No pytest suite added, per project convention (no test suite
exists yet in this repo).
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage**: every section of `docs/superpowers/specs/2026-07-10-backend-orchestrator-design.md` maps to a task — package structure (Task 1), `JobStore`/Redis (Task 2), `OrchestratorImpl`/`mocks.py` (Task 3), `pyproject.toml` (Task 2), demo verification (Task 4), commit plan (all four tasks' commit steps), boundaries (Global Constraints).
- **Deviation from the design doc, called out explicitly**: the design doc said "status set to ANALYZING, then COMPOSING" as if they were separate awaited stages; because `ml/graph.py`'s `run_analysis()` runs retrieval+analysis+composition as a single `ainvoke()` call, Task 3 sets `ANALYZING` before that call and `COMPOSING` immediately after it returns (both still visible to pollers, just not separated by real work in between). This doesn't change any contract type or field — only the internal timing of two status writes — so it doesn't need to go back through brainstorming, but is worth flagging when explaining Task 3's commit.
- **Concurrency fix vs. design doc**: the design doc's `MockRetriever` default didn't specify per-job vs. shared lifetime. Task 3 builds a fresh `MockRetriever` (and graph) per `run()` call specifically to avoid cross-job data leakage under concurrent analyses — noted in `mocks.py`'s docstring and the orchestrator's class docstring.
