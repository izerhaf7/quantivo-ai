# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BOA SaaS — a "Business Opportunity Analysis" tool built for the AMD Developer Hackathon (ACT II, Track Unicorn). Given a small business's context (category, location, stage, goals), the system scrapes local data, routes/filters it, runs sentiment + SWOT analysis via LLM agents, and composes a report with a heatmap. Indonesian-language planning docs; Indonesian and English mixed in code comments/docstrings.

This is a 4-person hackathon monorepo split by owner: **Indra** (frontend), **Razan** (backend/orchestration), **Izerhaf** (AI/ML), **Faiz** (scraping). Only `contracts/` and `ml/` have real code so far — `backend/`, `frontend/`, and `scraping/` are empty placeholders (each holds only a throwaway `commit.txt`).

## Contract-first architecture

The core principle: **`contracts/` is frozen first and everyone else codes against it + mocks**, so the four workstreams never block each other.

- `contracts/contracts.py` — single source of truth for all data shapes (Pydantic v2 models). Bump `CONTRACT_VERSION` and announce in-channel before changing any field; don't change silently.
- `contracts/interfaces.py` — `Protocol` definitions (function signatures) per domain: `ScraperModule` (Faiz), `DataRouter`/`Retriever`/`RerankAgent`/`SentimentAgent`/`SwotAgent`/`SummaryAgent` (Izerhaf), `Orchestrator` (Razan). Anyone can implement a Protocol with a mock and swap in the real thing later without touching callers.
- `contracts/api_stub.py` — FastAPI REST skeleton + orchestrator scaffold (`_run_pipeline`) returning schema-valid dummy data. Run it standalone so frontend work can proceed before the real backend exists.
- `fixtures/raw_data_items.sample.json` — sample `RawDataItem[]` so ML/backend work isn't blocked on the scraper.

Data flow across the pipeline (each arrow is a contract type in `contracts.py`):

```
Frontend --BusinessInput--> Backend --ScopeConfig--> Scraper --RawDataItem[]-->
Router --RoutedDataItem[]--> Preprocess/RAG --Chunk/RetrievedChunk-->
Sentiment+SWOT Agents (parallel) --SentimentResult/SWOTResult--> Summary Agent --Report--> Frontend
```

Key framing: `BusinessInput` is a 3-tier form (Tier 1 required: category/business_type/location/radius/stage; Tier 2 recommended: primary_goals/target_customers; Tier 3 optional: known_competitors/unique_value/budget). Tier fields exist because they drive specific downstream behavior (search keywords, routing prior, SWOT framing) — see `spesifikasi-teknis-boa-saas.md` §2 before adding/removing a field.

Routing (between scraping and preprocessing) is a **deterministic, explainable gate + multi-label classifier**, not an LLM call — see `RoutingScore`/`RoutingDecision`/`RouterConfig` in `contracts.py` and §4 of `spesifikasi-teknis-boa-saas.md` for the exact decision order (dedup → foreign-lang → relevance threshold → track assignment by `source_type`).

## `ml/` — agent orchestration layer (LangGraph)

Detailed docs in `ml/README.md`. Summary:

- `ml/graph.py` — builds the LangGraph: `retrieve_sentiment`/`retrieve_swot` run in parallel from `START`, feed `run_sentiment`/`run_swot`, which join into `run_summary`. Graceful degradation has **two layers**: a `retrieve_*` failure (e.g. Qdrant/embedding unreachable) stores a `None` sentinel for that branch's chunks and skips calling the agent entirely; a `run_*` (agent) failure stores `sentiment`/`swot` as `None` directly. Either way a note lands in `degradation_notes` (state uses an `operator.add` reducer since parallel branches may both write it) and `run_summary` still composes a `Report` with `status=PARTIAL`. `None` vs `[]` chunks matters: `None` means retrieval itself failed (skip the agent); `[]` means retrieval succeeded but found nothing (agent still runs, may return a valid-but-empty result).
- `ml/router.py` — `DataRouter`, the real `interfaces.DataRouter` implementation: a deterministic gate + multi-label classifier (not an LLM call) that runs between scraping and preprocessing. Decision order exactly matches spec §4: `is_duplicate` → `DISCARD("dup")`; foreign language + low relevance → `DISCARD("foreign_lang")`; relevance below `tau_discard` → `DISCARD("off_topic")`; otherwise assign track(s) by `source_type` (+ `SENTIMENT` alongside `SWOT` for news/blog/article when geo matches closely). `relevance_score` is cosine similarity between the item and `scope.interpreted_summary` (deliberately *not* the raw `search_keywords` list — repeating keyword phrases dilutes the similarity signal). Dedup compares each item only against already-*kept* items so far, not the whole batch.
- `ml/agents.py` — concrete agent implementations, all conforming to `interfaces.py` Protocols and only ever returning `contracts.py` types. Enforces two constraints **in code, not just prompts**: sentiment `demographics` stays `None` unless the source text explicitly states it (never inferred), and SWOT competitors come from Places data (`place_id` + aggregate rating), never verbatim review quotes.
- `ml/confidence.py` — `SectionConfidence` is computed quantitatively from `(source_count, agreement, recency)`. This is a hard rule from the spec: confidence scores must never be LLM-generated/subjective.
- `ml/llm.py` — `LLMClient` Protocol with `FireworksLLMClient` (production, targets AMD MI300X/MI350 per the hackathon's AMD-hardware requirement — $50 Fireworks credit comes from the AMD AI Developer Program, see `spesifikasi-teknis-boa-saas.md` §3) and `MockLLMClient` (deterministic keyword-based, offline, no API key). Per spec, use a small 7-8B model for `SentimentAgentImpl` (called once per chunk — volume matters) and a 70B model for `SwotAgentImpl`/`SummaryAgentImpl` (called once per report — quality matters); see `ml/llm_demo.py`.
- `ml/llm_demo.py` — runnable proof of `FireworksLLMClient` for real (needs `FIREWORKS_API_KEY`, see `.env.example`) — same pipeline as `run_demo.py` but with real LLM reasoning split small/large per task.
- `ml/embeddings.py` — `EmbeddingClient` Protocol (returns dense + optional sparse vectors) with `TEIEmbeddingClient` (production, self-hosted BGE-M3 server — `/embed` contract verified end-to-end against a real BGE-M3 model on AMD GPU hardware, see below), `LocalBGEM3EmbeddingClient` (local dev via the optional `FlagEmbedding` package, lazily imported), and `MockEmbeddingClient` (deterministic character-trigram hashed vectors, offline, no model weights — shared by `router.py` and `retriever.py`).
- `ml/retriever.py` — `QdrantRetriever`, the real `interfaces.Retriever` implementation: hybrid dense+sparse search fused via RRF, filtered by `track` payload. `location=":memory:"` runs Qdrant in-process for testing without a server; production passes `url=`.
- `ml/chunking.py` — `chunks_from_routed()`: turns `DataRouter` output into `Chunk`s. Only `kept` items pass through; an item with multi-label tracks (e.g. a local news item tagged both SWOT and SENTIMENT) produces one `Chunk` per track (`Chunk.track` is singular). `relevance_score`/`recency_score` are inherited directly from `RoutingScore`, not recomputed — this is the real preprocessing step between routing and retrieval, not demo glue.
- `ml/run_demo.py` — runnable end-to-end proof of the full pipeline: fixtures → `DataRouter` → `chunking` → `MockRetriever` → agent graph → `Report`.
- `ml/retriever_demo.py` — runnable end-to-end proof of the same routing→chunking step feeding `QdrantRetriever` specifically (ingest, hybrid retrieve, track-filtering) using `:memory:` Qdrant + `MockEmbeddingClient`.
- `ml/router_demo.py` — runnable end-to-end proof of `DataRouter` against the fixtures, including the spec's explicit acceptance test: fixture item #5 (deliberately off-topic + foreign-language + stale) must be discarded.

Mock → production swap points (wiring only, agent logic doesn't change): `MockLLMClient` → `FireworksLLMClient` (needs `FIREWORKS_API_KEY`), `MockRetriever` → `QdrantRetriever` (needs a running Qdrant instance, e.g. `docker run -p 6333:6333 qdrant/qdrant`), `MockEmbeddingClient` → `TEIEmbeddingClient`/`LocalBGEM3EmbeddingClient` (needs a real BGE-M3 embedding model serving dense+sparse vectors — Qdrant alone doesn't generate embeddings, and the router's `relevance_score` also depends on it), `HeuristicRerankAgent`'s heuristic → BGE-reranker-v2-m3 cross-encoder.

**Verified vs. not yet verified**: `QdrantRetriever`'s ingest/retrieve/RRF-fusion/track-filtering, both layers of graph-level graceful degradation, `DataRouter`'s full decision order (including dedup, tested with a synthetic duplicate since the fixtures don't contain a real one), and now real BGE-M3 embeddings have all been run for real, not just written. `run_demo.py` and `retriever_demo.py` route through the actual `DataRouter` + `chunking.py` rather than a hardcoded `source_type → track` mapping (the fix is observable: item #5, the planted crypto post, used to leak into `sentiment` retrieval results under the old naive mapping and now correctly gets filtered out before it ever reaches the retriever). `TEIEmbeddingClient`'s `/embed` contract was exercised end-to-end against a real BGE-M3 model running on an AMD GPU (gfx1100/RDNA3, ROCm 7.2, via the team's AMD Developer Hackathon notebook instance) behind a self-built FastAPI wrapper and a temporary Cloudflare quick tunnel — confirmed `dense_dim=1024`, sparse vectors present, and semantically sane cosine similarity (correctly ranked a coffee-shop-related sentence above a tangential macro-economic stat above an unrelated stock-market sentence), fixing exactly the ranking weakness the mock was known to have (see `router_demo.py`'s honest caveat about the macro-stat item). That tunnel is dev/demo-only and ephemeral — it dies with the notebook session and the team's shared GPU-hour quota, so it's not a standing production endpoint, and the eventual real production server (whatever the team deploys, e.g. TEI/Infinity) is a different implementation that still needs its own contract check even though our stand-in server proved the client-side shape works. What's *not* yet exercised: an actual Qdrant server over the network (still only tested via Qdrant `:memory:` mode).

## Commands

Python dependencies are managed with `uv` via the root `pyproject.toml`/`uv.lock` (`pydantic`, `fastapi`, `uvicorn`, `httpx`, `langgraph`, `qdrant-client`). Run `uv sync` once from the repo root to create `.venv`.

Run the ML demos end-to-end (offline, no API key/server needed) — `contracts/` and `ml/` aren't installable packages, so `PYTHONPATH` has to include both:
```bash
# macOS/Linux
PYTHONPATH=contracts:ml uv run python ml/run_demo.py          # full agent graph
PYTHONPATH=contracts:ml uv run python ml/retriever_demo.py    # QdrantRetriever alone
PYTHONPATH=contracts:ml uv run python ml/router_demo.py       # DataRouter alone
# Windows (PYTHONPATH separator is ';', not ':')
PYTHONPATH="contracts;ml" uv run python ml/run_demo.py
PYTHONPATH="contracts;ml" uv run python ml/retriever_demo.py
PYTHONPATH="contracts;ml" uv run python ml/router_demo.py
```

The three demos above are fully offline (Mock everything, no API key). `ml/llm_demo.py` is the exception — it calls the real Fireworks API, so copy `.env.example` to `.env`, fill in `FIREWORKS_API_KEY`, then run `PYTHONPATH="contracts;ml" uv run python ml/llm_demo.py`. `.env` is gitignored; never commit real keys.

Run the fake backend (for frontend work against a schema-valid API):
```bash
cd contracts
uv run uvicorn api_stub:app --reload
# then open http://localhost:8000/docs, or generate TS types:
# npx openapi-typescript http://localhost:8000/openapi.json -o api.d.ts
```

No test suite, linter, or CI config exists in this repo yet.

## Working conventions

- Every Python module (`backend/`, `ml/`, `scraping/` once populated) imports types from `contracts/` rather than redefining shapes locally.
- When implementing a real agent/scraper/router, implement the matching `Protocol` in `contracts/interfaces.py` exactly — orchestration code (`ml/graph.py`, future `backend/`) calls through the Protocol, not concrete classes, so mocks and real implementations are interchangeable.
- Scraper modules must never raise on source failure — return `[]` and log (circuit-breaker pattern), so one dead source degrades a report instead of failing it.
