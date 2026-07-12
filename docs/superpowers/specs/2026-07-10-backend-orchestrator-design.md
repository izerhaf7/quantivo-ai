# Backend Orchestrator — Design Spec

Date: 2026-07-10
Owner: Razan (backend/infra)
Branch: `razan/backend-skeleton`

## Goal

Fill the placeholder `backend/` package with a real implementation of the
`Orchestrator` Protocol (`contracts/interfaces.py`), replacing the dummy
sleep-based `_run_pipeline` in `contracts/api_stub.py`. Wire the pipeline
stages (SCRAPING → ROUTING → PREPROCESSING → INDEXING → ANALYZING →
COMPOSING) to real `ml/` implementations via Protocols, mock-backed by
default so it runs fully offline (no API key, no external services besides
Redis).

## Boundaries (non-goals)

This work touches **only** `backend/` (new) and `pyproject.toml` (one new
dependency: `redis`). It does **not** modify:
- `contracts/` (`contracts.py`, `interfaces.py`, `api_stub.py`) — frozen
  contract files. `api_stub.py` is left as-is; it remains Indra's reference
  stub for generating frontend TS types and is not deleted or redirected.
- `ml/` — Izerhaf's domain. Consumed only via `interfaces.py` Protocols and
  the concrete Mock/real classes already exported from `ml/*.py`
  (`DataRouter`, `chunks_from_routed`, `build_agent_graph`, `run_analysis`,
  `HeuristicRerankAgent`, `SentimentAgentImpl`, `SwotAgentImpl`,
  `SummaryAgentImpl`, `MockLLMClient`, `MockEmbeddingClient`).
- `frontend/`, `scraping/` — untouched placeholders.
- `fixtures/raw_data_items.sample.json` — read-only, used as a scraper
  stand-in (see below).

## Package structure

```
backend/
  __init__.py
  main.py         # FastAPI app + REST endpoints (moved from api_stub.py)
  orchestrator.py # OrchestratorImpl(interfaces.Orchestrator): create_scope + run
  store.py        # JobStore: Redis-backed job/state store
  mocks.py        # MockRetriever (offline default, mirrors ml/run_demo.py's inline class)
  run_demo.py     # manual end-to-end demo (starts app in-process, hits endpoints, prints stages)
```

## `store.py` — JobStore

- `JobStore(redis_url: str)` wraps `redis.asyncio.Redis.from_url(redis_url)`.
  One instance created in a FastAPI `lifespan` context manager, closed on
  shutdown, shared via app state.
- Key scheme: `boa:job:{scope_id}` → a Redis hash with fields `status`,
  `scope` (JSON via `.model_dump_json()`), `report` (JSON or empty),
  `sections_ready` (JSON list), `error`.
- TTL: set via `EXPIRE` to `(scope.expires_at - now)` seconds right after
  `create()`; refreshed on every subsequent write so an in-flight job
  doesn't expire mid-pipeline before the 48h window from `ScopeConfig`.
- Methods: `create(scope)`, `get_status(scope_id)`, `set_status(scope_id,
  status)`, `set_report(scope_id, report)`, `set_sections_ready(scope_id,
  list[str])`, `set_error(scope_id, msg)`, `get(scope_id) -> dict | None`,
  `ping() -> bool` (used by `/health`).
- Not added to `interfaces.py` — job storage isn't one of the four
  contracted seams (Faiz/Izerhaf/Razan/Indra), it's backend-internal infra.

## `orchestrator.py` — OrchestratorImpl

- `create_scope(inp)` — moves `api_stub._build_scope`'s logic verbatim
  (keyword/competitor-query construction unchanged, it was already correct).
- `run(scope) -> Report`:
  1. **SCRAPING** — read `fixtures/raw_data_items.sample.json`, validate each
     as `RawDataItem`, override `scope_id` to the real job's `scope.scope_id`
     (fixtures hardcode `"SCOPE-DEMO"`). Stand-in until `scraping/` has real
     code (step 5 of the original ask).
  2. **ROUTING** — `ml.router.DataRouter(embedder=MockEmbeddingClient()).route(...)`.
  3. **PREPROCESSING** — `ml.chunking.chunks_from_routed(routed)`.
  4. **INDEXING** — `backend.mocks.MockRetriever(chunks)` (offline default).
  5. **ANALYZING + COMPOSING** — `ml.graph.build_agent_graph(...)` with
     `HeuristicRerankAgent` + `Sentiment/Swot/SummaryAgentImpl(MockLLMClient())`,
     then `run_analysis(graph, scope, market_notes)`.
- Graph built once at import time (agents are stateless).
- Status written to `JobStore` before each stage; `sections_ready` set after
  ANALYZING; final `Report` (real `status` from `SummaryAgentImpl` —
  `COMPLETED`/`PARTIAL`) saved after COMPOSING.
- Function signatures reference `interfaces.py` Protocol types
  (`Retriever`, `SentimentAgent`, etc.); concrete Mock/real classes are only
  instantiated at the wiring edge, matching CLAUDE.md's Protocol-not-concrete
  convention.

## `main.py` — FastAPI app

Same 4 endpoints as `api_stub.py` (`POST /api/analyses`, `POST
/api/analyses/{id}/confirm`, `GET /api/analyses/{id}`, `GET
/api/analyses/{id}/report`), backed by `JobStore` instead of the in-memory
`_JOBS` dict, plus:

- `GET /health` → `{"status": "ok", "redis": "ok"|"unreachable"}`.

`confirm` still uses `asyncio.create_task(orchestrator.run(scope))` — arq is
explicitly out of scope for this branch (see Decisions below), left as a
code comment marking the future swap point.

## `pyproject.toml`

Add `"redis>=5.2"` to `dependencies`. `arq` is **not** added this pass.

## Commit plan (branch `razan/backend-skeleton`, no push to main/remote)

1. `git checkout -b razan/backend-skeleton`
2. Commit 1 — scaffold: `backend/__init__.py`, `backend/main.py` (endpoints
   moved from `api_stub.py`, still using the dummy sleep-based pipeline
   temporarily), `GET /health` (liveness only for now).
3. Commit 2 — `backend/store.py` (`JobStore`), `pyproject.toml` +`redis`,
   wire `main.py` to `JobStore` (replace `_JOBS`), extend `/health` with
   Redis ping.
4. Commit 3 — `backend/orchestrator.py` (`OrchestratorImpl`) +
   `backend/mocks.py` (`MockRetriever`), wire into `main.py`'s `confirm`
   endpoint, remove the dummy sleep-based pipeline.
5. Commit 4 — `backend/run_demo.py` (manual end-to-end demo, mirrors
   `ml/run_demo.py`'s style), run it and report results.

Explain each commit's diff before moving to the next.

## Decisions (from clarifying questions)

- **arq**: deferred to a future branch. This branch keeps
  `asyncio.create_task`, structured so swapping to an arq worker later only
  touches the enqueue call site.
- **Redis config**: `REDIS_URL` env var (default
  `redis://localhost:6379`), read via `python-dotenv` (already a
  dependency) — consistent with the existing `FIREWORKS_API_KEY` pattern in
  `.env.example`.
- **Verification**: manual demo script (`backend/run_demo.py`), no new test
  framework — consistent with `ml/run_demo.py` / `retriever_demo.py` /
  `router_demo.py` and CLAUDE.md's note that no test suite exists yet.
- **Health check**: liveness + Redis ping, since job state now depends on
  Redis being reachable.
- **`api_stub.py`**: left untouched as Indra's frontend-facing reference
  stub; `backend/main.py` becomes the real running app.
