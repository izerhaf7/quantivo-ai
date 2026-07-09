# `ml/` — Agent Layer (LangGraph)

Layer orkestrasi agent untuk BOA. Dibangun **di atas kontrak** (`contracts/`):
LangGraph hanya merangkai; setiap agent mematuhi Protocol di
`contracts/interfaces.py`, jadi logika agent tetap terisolasi & bisa di-mock.

## Topologi

```
              ┌─ retrieve_sentiment ─ run_sentiment ─┐
 START ──────►┤                                      ├─► run_summary ─► END
              └─ retrieve_swot ────── run_swot ───────┘
```

- Cabang **Sentiment ∥ SWOT** independen → LangGraph jalankan **paralel**
  (dua edge dari START). `run_summary` punya **dua edge masuk** → ia menunggu
  kedua cabang selesai = **join alami**. (Menekan latensi, sesuai Bagian 3.)
- **Rerank Agent** dipanggil di dalam node `retrieve_*` (bagian dari retrieval).
- **Graceful degradation, dua lapis**: kalau `retrieve_*` gagal (mis. Qdrant/
  embedding server tak terjangkau) ATAU `run_*` (agent) gagal, cabang itu
  menaruh hasil `None` + catatan degradasi (state pakai reducer
  `operator.add`); Summary tetap jalan dengan data parsial →
  `Report.status = PARTIAL`. **Sentinel `None` vs `[]`**: retrieval yang
  gagal total menaruh `None` (skip pemanggilan agent); retrieval yang sukses
  tapi tak menemukan apa pun menaruh `[]` (agent tetap dipanggil, boleh
  mengembalikan hasil kosong). Sudah **teruji** untuk kedua lapis kegagalan.

## File

| File | Isi |
|---|---|
| `graph.py` | **Layer utama.** `AgentState`, node, wiring, `build_agent_graph(...)`, `run_analysis(...)` |
| `router.py` | `DataRouter` — metrik routing deterministik & explainable (Bagian 4), gate + klasifikasi multi-label sebelum preprocessing |
| `agents.py` | Implementasi agent (Rerank heuristik, Sentiment, SWOT, Summary) — mematuhi Protocol |
| `llm.py` | `LLMClient` Protocol + `FireworksLLMClient` (produksi, AMD) + `MockLLMClient` (offline) |
| `embeddings.py` | `EmbeddingClient` Protocol (dense+sparse) + `TEIEmbeddingClient` (produksi, server self-host) + `LocalBGEM3EmbeddingClient` (dev lokal, opsional) + `MockEmbeddingClient` (offline) — dipakai bareng oleh `router.py` dan `retriever.py` |
| `retriever.py` | `QdrantRetriever` — implementasi nyata `interfaces.Retriever`, hybrid dense+sparse via RRF, filter payload per `track` |
| `chunking.py` | `chunks_from_routed()` — bentuk `Chunk` dari `RoutedDataItem` (hasil `DataRouter`); satu Chunk per track utk item multi-label, `relevance_score`/`recency_score` diwarisi dari `RoutingScore` |
| `confidence.py` | Confidence **kuantitatif** per-section (Bagian 8.2), bukan angka LLM |
| `run_demo.py` | Bukti pipeline penuh end-to-end: fixtures → `DataRouter` → `chunking` → `MockRetriever` → graph agent |
| `retriever_demo.py` | Bukti `QdrantRetriever` end-to-end: fixtures → `DataRouter` → `chunking` → ingest → hybrid search → filter track, via Qdrant in-memory + `MockEmbeddingClient` |
| `router_demo.py` | Bukti `DataRouter` jalan terhadap fixtures — verifikasi eksplisit item #5 (post kripto, off-topic+asing+basi) ter-DISCARD, item lain kept, dan jalur dedup |

### `DataRouter` (`router.py`)

Gate + klasifikasi multi-label, urutan keputusan persis Bagian 4 spesifikasi:

```
1. is_duplicate                          -> DISCARD("dup")
2. lang bukan {id,en} & relevance rendah -> DISCARD("foreign_lang")
3. relevance < tau_discard                -> DISCARD("off_topic")
4. selain itu: assign track dari source_type (+ geo utk news/blog/article)
```

- `relevance_score`: cosine similarity `embed(item.raw_text)` vs
  `embed(scope_intent)`, dihitung oleh `EmbeddingClient` yang disuntik (sama
  Protocol dgn `retriever.py` — satu embedder, dua konsumen).
  `_scope_intent_text()` sengaja HANYA pakai `interpreted_summary` +
  `business_type` + `description` (bukan `search_keywords` mentah) — teks
  keyword yang berulang justru mengencerkan sinyal cosine similarity.
- `geo_match`: bandingkan `item.geo_hint` vs `scope.business_input.location`
  (district=EXACT, city=CITY, province=REGION, selainnya NONE).
- `recency_score`: decay eksponensial dari `published_at` (half-life
  `RouterConfig.recency_halflife_days`, default 180 hari). Item tanpa
  `published_at` (mis. `places_listing`) dapat skor netral `0.5`, bukan 0 —
  supaya tak dihukum penuh karena sumbernya memang tak selalu punya tanggal.
- `is_duplicate`: cosine similarity terhadap item YANG SUDAH di-*keep*
  sejauh ini (bukan seluruh batch) ≥ `dup_similarity_threshold` (default
  0.92).
- `quality_score` komposit (`0.5·relevance + 0.3·geo + 0.2·recency`) dipakai
  lagi sbg dasar confidence (Bagian 8.2) — satu metrik, dua kebutuhan.

**Catatan verifikasi jujur**: `router_demo.py` HANYA meng-assert keras hal
yang benar-benar dikontrakkan spesifikasi (item #5 wajib discard, dedup
wajib discard). 4 item on-topic lain dilaporkan tapi TIDAK di-assert keras
harus semuanya kept, karena `MockEmbeddingClient` (bag-of-trigram, tanpa
pemahaman semantik) kadang salah menilai relevansi item yang leksikal jauh
dari teks intent (mis. statistik makro tanpa kata "kopi") — itu keterbatasan
mock yang jujur, bukan bug router. BGE-M3 asli akan jauh lebih akurat.

## Jalankan demo (offline, tanpa API key)

Dependensi dikelola via `uv` (lihat `pyproject.toml` di root repo).

```bash
uv sync   # sekali saja, dari root repo

# macOS/Linux:
PYTHONPATH=contracts:ml uv run python ml/run_demo.py
PYTHONPATH=contracts:ml uv run python ml/retriever_demo.py
PYTHONPATH=contracts:ml uv run python ml/router_demo.py
# Windows (PYTHONPATH pakai ';', bukan ':'):
PYTHONPATH="contracts;ml" uv run python ml/run_demo.py
PYTHONPATH="contracts;ml" uv run python ml/retriever_demo.py
PYTHONPATH="contracts;ml" uv run python ml/router_demo.py
```

## Titik swap Mock → Produksi (hanya di wiring, logika agent tak berubah)

| Mock (demo) | Produksi |
|---|---|
| `MockLLMClient()` | `FireworksLLMClient(model=...)` (set `FIREWORKS_API_KEY`) |
| `MockRetriever(chunks)` | `QdrantRetriever(embedder=..., url="http://<qdrant-host>:6333")` (`retriever.py`) |
| `MockEmbeddingClient()` | `TEIEmbeddingClient()` (server self-host BGE-M3, set `EMBEDDING_BASE_URL`) atau `LocalBGEM3EmbeddingClient()` (dev lokal via `FlagEmbedding`) |
| `HeuristicRerankAgent()` | BGE-reranker-v2-m3 di dalam `rerank()` (cross-encoder) |

**Catatan `QdrantRetriever`**: endpoint & bentuk response `TEIEmbeddingClient`
adalah kerangka (placeholder) — sesuaikan dgn kontrak server embedding yang
benar-benar dideploy tim di AMD Dev Cloud/ROCm (Infinity atau
text-embeddings-inference). Bagian yang sudah **diverifikasi jalan nyata**:
`QdrantRetriever` ingest/retrieve, RRF fusion dense+sparse, filter payload
`track`, dan round-trip `Chunk` — semua lewat `retriever_demo.py` dgn Qdrant
`:memory:`. Yang BELUM diverifikasi (butuh infra nyata): koneksi ke server
Qdrant sungguhan, dan embedding BGE-M3 sungguhan (dense/sparse asli, bukan
hash pseudo-random `MockEmbeddingClient`).

**Gap integrasi ditutup**: `run_demo.py` & `retriever_demo.py` sekarang
memanggil `DataRouter` sungguhan (bukan `_TRACK` dict hardcoded) lalu
`chunking.chunks_from_routed()` sebelum retrieval — chunk yang sampai ke
retriever/agent sudah lolos gate relevansi/dedup/bahasa/basi, dan
`relevance_score`/`recency_score`-nya benar-benar diwarisi dari
`RoutingScore`, bukan angka hardcode. Efek nyata yang teramati: item #5
(post kripto) yang sebelumnya BOCOR ke hasil retrieval `sentiment` (karena
`_TRACK` dict lama hanya memetakan by `source_type` tanpa gate apa pun)
sekarang benar-benar tersaring sebelum sampai ke retriever.

## Cara Razan (Backend) memanggilnya

Di dalam orchestrator (`api_stub.py::_run_pipeline`), setelah RAG ingestion:

```python
from graph import build_agent_graph, run_analysis

graph = build_agent_graph(
    retriever=qdrant_retriever,
    rerank_agent=bge_rerank_agent,
    sentiment_agent=SentimentAgentImpl(fireworks),
    swot_agent=SwotAgentImpl(fireworks),
    summary_agent=SummaryAgentImpl(fireworks),
)
report = await run_analysis(graph, scope, market_notes=market_notes)
# report: contracts.Report  -> langsung dikirim ke frontend
```

Graph dibangun **sekali** saat startup (agent stateless), lalu `run_analysis`
dipanggil per job. Cocok dijalankan di dalam worker `arq`.

## Catatan constraint yang ditegakkan di KODE (bukan cuma prompt)

- **Sentiment**: `demographics` = `None` kalau sumber tak eksplisit menyebut
  umur/gender. Tidak pernah dikarang (Bagian 6.1).
- **SWOT**: kompetitor dari data Places (`place_id` + rating agregat), tanpa
  quote ulasan verbatim (Bagian 6.2).
- **Confidence**: dihitung dari `(jumlah_sumber, kesepakatan, recency)` di
  `confidence.py`, bukan di-generate LLM (Bagian 8.2).
