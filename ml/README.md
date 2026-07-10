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
| `llm_demo.py` | Bukti `FireworksLLMClient` sungguhan (bukan Mock) — sama pipeline `run_demo.py` tapi LLM nyata di AMD MI300X/MI350, model dibagi kecil (sentiment, per-chunk) vs besar (SWOT+Summary, per-report). Butuh `FIREWORKS_API_KEY` (lihat `.env.example`) |

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

## Jalankan demo

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

`run_demo.py`, `retriever_demo.py`, `router_demo.py` di atas jalan **offline,
tanpa API key** (semua Mock). `llm_demo.py` beda — butuh key sungguhan:

```bash
cp .env.example .env   # isi FIREWORKS_API_KEY, jangan commit .env
PYTHONPATH="contracts;ml" uv run python ml/llm_demo.py
```

## Titik swap Mock → Produksi (hanya di wiring, logika agent tak berubah)

| Mock (demo) | Produksi |
|---|---|
| `MockLLMClient()` | `FireworksLLMClient(model=...)` (set `FIREWORKS_API_KEY`) — pakai model KECIL (7-8B) utk `SentimentAgentImpl` (dipanggil per-chunk), model BESAR (70B) utk `SwotAgentImpl`/`SummaryAgentImpl` (sekali per report). Lihat `llm_demo.py` |
| `MockRetriever(chunks)` | `QdrantRetriever(embedder=..., url="http://<qdrant-host>:6333")` (`retriever.py`) |
| `MockEmbeddingClient()` | `TEIEmbeddingClient()` (server self-host BGE-M3, set `EMBEDDING_BASE_URL`) atau `LocalBGEM3EmbeddingClient()` (dev lokal via `FlagEmbedding`) |
| `HeuristicRerankAgent()` | BGE-reranker-v2-m3 di dalam `rerank()` (cross-encoder) |

**Catatan `FireworksLLMClient`**: sudah diwire lengkap (`llm.py`) dan siap
jalan (`llm_demo.py`) begitu `FIREWORKS_API_KEY` diisi (kredit $50 dari AMD
AI Developer Program, lihat `spesifikasi-teknis-boa-saas.md`). Status per
dokumen ini: **BELUM dijalankan dengan key sungguhan** — beda dari
`TEIEmbeddingClient` di bawah yang sudah. Begitu `llm_demo.py` sukses jalan,
update catatan ini jadi "diverifikasi jalan nyata" + hasil aslinya, jangan
biarkan dokumen bilang "belum" kalau sebenarnya sudah teruji.

**Catatan `TEIEmbeddingClient`**: kontrak `/embed`-nya sudah **diverifikasi
jalan nyata** terhadap model BGE-M3 sungguhan di GPU AMD asli (gfx1100/RDNA3,
ROCm 7.2, via instance notebook AMD Developer Hackathon tim-975), di
belakang server FastAPI custom (buatan sendiri, meniru kontrak `/embed`
persis, pakai `FlagEmbedding.BGEM3FlagModel`) + tunnel sementara Cloudflare
Quick Tunnel. Hasil: `dense_dim=1024`, sparse vector ada, dan cosine
similarity masuk akal — kalimat "kedai kopi di Bandung" vs "kopinya enak"
= 0.66, vs statistik makro tangensial (pengeluaran pangan Kabupaten Bekasi)
= 0.42, vs kalimat saham yang tak nyambung = 0.29 — memperbaiki tepat
kelemahan yang tercatat di atas untuk `MockEmbeddingClient` (item macro-stat
yang sebelumnya susah dinilai relevansinya oleh mock). **Tapi**: tunnel itu
dev/demo-only & sementara (mati kalau sesi notebook berhenti atau kuota jam
GPU tim habis) — bukan endpoint produksi permanen, dan server FastAPI custom
itu bukan server produksi final tim (masih stand-in) — kalau tim nanti
deploy TEI/Infinity sungguhan, kontraknya perlu dicek ulang sendiri karena
implementasinya beda, meski bentuk request/response `EmbeddingClient` sudah
terbukti cocok.

**Catatan `QdrantRetriever`**: bagian yang sudah **diverifikasi jalan
nyata**: `QdrantRetriever` ingest/retrieve, RRF fusion dense+sparse, filter
payload `track`, dan round-trip `Chunk` — semua lewat `retriever_demo.py`
dgn Qdrant `:memory:`. Yang BELUM diverifikasi (butuh infra nyata): koneksi
ke server Qdrant sungguhan di jaringan (masih cuma `:memory:`). Qdrant
sengaja TIDAK dijalankan di instance GPU AMD yang sama dgn embedding server
— Qdrant CPU/RAM-bound, tak butuh GPU, jadi menjalankannya di sana cuma
menghabiskan kuota jam GPU tim tanpa manfaat.

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
from llm import FireworksLLMClient

fireworks_small = FireworksLLMClient(model="accounts/fireworks/models/llama-v3p1-8b-instruct")
fireworks_large = FireworksLLMClient(model="accounts/fireworks/models/llama-v3p3-70b-instruct")

graph = build_agent_graph(
    retriever=qdrant_retriever,
    rerank_agent=bge_rerank_agent,
    sentiment_agent=SentimentAgentImpl(fireworks_small),  # per-chunk, volume tinggi
    swot_agent=SwotAgentImpl(fireworks_large),             # sekali per report
    summary_agent=SummaryAgentImpl(fireworks_large),
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
