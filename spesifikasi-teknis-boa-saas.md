# Rencana Teknis & Kontrak Paralel — BOA SaaS
**AMD Developer Hackathon: ACT II — Track Unicorn**
**Versi 1.1** · pendamping untuk `spesifikasi-teknis-boa-saas.md`.
Fokus: **stack konkret + desain form konteks + kontrak antar-domain** supaya Indra, Izerhaf, Razan, dan Faiz bisa jalan paralel dari Jam-0.

> **Perubahan v1.1:** `BusinessInput` diperluas jadi form konteks 3-tingkat (§2). `contracts.py`, `api_stub.py` sudah diperbarui & divalidasi. Enum baru: `BusinessStage`, `PrimaryGoal`, `TargetCustomer`, `BudgetRange`.

---

## 0. Prinsip yang mengunci semuanya: *Contract-First*

Masalah utama tim 4 orang di hackathon: saling menunggu. Frontend nunggu API, backend nunggu agent, agent nunggu data scraping. Solusinya: **bekukan kontrak dulu, baru semua orang kerja terhadap MOCK.**

Yang dibekukan di Jam-0 (sudah dibuat & divalidasi jalan, tinggal `git commit`):

| File | Isi | Status |
|---|---|---|
| `contracts/contracts.py` | Bentuk **data** (Pydantic). Satu sumber kebenaran. | ✅ tervalidasi |
| `contracts/interfaces.py` | Bentuk **fungsi** (Protocol) per domain. | ✅ tervalidasi |
| `contracts/api_stub.py` | Kontrak **REST** + kerangka orchestrator (`uvicorn` → OpenAPI). | ✅ jalan |
| `fixtures/raw_data_items.sample.json` | Data contoh, biar AI/ML & Backend tak menunggu scraper. | ✅ tervalidasi |

Aturan: siapa pun mau ubah field → umumkan di channel + naikkan `CONTRACT_VERSION`. Titik.

---

## 1. Keputusan Stack (dipilih dari menu Bagian 9 spesifikasi)

**Bahasa:** Python 3.11+ untuk backend/AI/scraping (Pydantic dipakai bareng = keuntungan paralel besar), TypeScript untuk frontend.

| Layer | Pilihan | Alasan singkat |
|---|---|---|
| **Frontend** (Indra) | React + Vite + TS, TailwindCSS + shadcn/ui, TanStack Query | Cepat; tipe di-generate dari OpenAPI (`openapi-typescript`) → tak pernah nebak field |
| **Heatmap** (Indra) | **MapLibre GL JS** (layer `heatmap` native) | Gratis, tanpa token Mapbox. Render dari GeoJSON kiriman backend. Recharts untuk chart pendukung |
| **Backend/Orkestrasi** (Razan) | **FastAPI** + Pydantic v2, orkestrasi **asyncio murni** | Pipeline tetap (bukan agent-dynamic). asyncio = paling mudah di-debug saat demo. Sentiment ∥ SWOT via `asyncio.gather` |
| **Job & state + TTL** (Razan) | **Redis** (+ `arq` worker async) | `EXPIRE` Redis = TTL buffer data mentah gratis (Bagian 5.3). `arq` beri durabilitas job tanpa berat Celery |
| **Vector DB** (Izerhaf) | **Qdrant** | Punya **payload filter geo** + dukung sparse+dense vector → cocok untuk geo-relevance rerank & hybrid BGE-M3 |
| **Embedding** (Izerhaf) | **BGE-M3** (MIT, 100+ bahasa incl. ID) | Dense **dan** sparse dalam satu model → hybrid tanpa index BM25 terpisah. Standar de-facto RAG multibahasa self-host 2026 |
| **Reranker** (Izerhaf) | **BGE-reranker-v2-m3** | Cross-encoder multibahasa ringan, pasangan alami BGE-M3 |
| **LLM inference** (Izerhaf) | **Fireworks AI** (Llama 3.3 70B / Qwen2.5 untuk SWOT+Summary; model 7-8B untuk klasifikasi/rerank) | Fireworks jalan **di AMD MI300X/MI350** → penuhi syarat "AMD hardware". AMD AI Developer Program kasih **$50 kredit Fireworks** |
| **Scraping** (Faiz) | httpx (async) + tenacity (retry/circuit-breaker), feedparser (RSS) | Async = banyak sumber paralel; tenacity = graceful degradation per-sumber |
| **Sumber** (Faiz) | Tavily/Brave (web search), pytrends *atau* SerpApi Trends, Google Places client resmi, **BPS WebAPI** | Tavily ramah-LLM & murah. pytrends gampang tapi rapuh → SerpApi Trends cadangan |

### Catatan AMD (penting untuk juri)
Supaya "pakai AMD" bermakna, bukan sekadar klaim: **self-host BGE-M3 + BGE-reranker (dan opsional 1 LLM) di AMD Developer Cloud + ROCm** (vLLM untuk LLM; Infinity/TEI untuk embedding), sementara Fireworks (juga di AMD Instinct) meng-handle LLM reasoning berat. Cerita: "beban embedding/rerank berjalan di ROCm milik kami sendiri."

> Claude API boleh dipakai sebagai *fallback* kualitas untuk SWOT/Summary bila budget ada, tapi jangan jadikan jalur utama demo — jaga cerita "compute di AMD" tetap dominan.

---

## 2. Form Konteks Klien — dasar seluruh pipeline

Form ini secara efektif adalah **sumber konteks** untuk scraping → routing → LLM. Aturan penentuan isi: untuk tiap field, tanya *"kalau kosong, tahap mana yang nembak buta?"* Kalau tak ada yang rusak, field itu cuma bikin form berat. Hasilnya jatuh ke 3 tingkat. Semua sudah dimodelkan di `BusinessInput` (`contracts.py`).

### Tingkat 1 — WAJIB (tanpa ini pipeline menebak-nebak)

| Field | Widget | Menyetir apa |
|---|---|---|
| `category` (`IndustryCategory`) | dropdown | Query terarah per sumber + prior utama router. Wajib dropdown, bukan free-text (Tahap 0 spesifikasi) |
| `business_type` + `description` | text pendek | Keyword pencarian & Trends; teks yang di-embed router untuk `relevance_score`; objek pembanding SWOT |
| `location.city` (+ `district` opsional) | autocomplete | Semua yang geo: Places, filter Qdrant, heatmap. Kecamatan → analisis hyper-local |
| `radius_km` | slider 1/3/5/10 km | Cakupan Places & arti "kompetitor lokal" |
| `business_stage` (`BusinessStage`) | dropdown | **Framing** seluruh rekomendasi: `idea` (validasi) ≠ `established` (optimasi) ≠ `expanding` (ekspansi) |

### Tingkat 2 — SANGAT DISARANKAN (ubah "laporan generik" → "pendukung keputusan")

| Field | Widget | Menyetir apa |
|---|---|---|
| `primary_goals` (`PrimaryGoal`) | multi-select | **Paling berdampak, paling sering dilupakan.** Memberi tahu Summary Agent section mana ditekankan & ke mana rekomendasi diarahkan. Tanpa ini laporan cuma "menyajikan data" |
| `target_customers` (`TargetCustomer`) | multi-select | Sentimen *siapa* yang dihitung + menambah keyword pencarian + menajamkan SWOT |

### Tingkat 3 — OPSIONAL (bonus akurasi; jangan diwajibkan)

| Field | Widget | Menyetir apa |
|---|---|---|
| `known_competitors` | text list | Seed SWOT + verifikasi apakah Places menemukan yang sama |
| `unique_value` | text pendek | SWOT strengths lebih spesifik, bukan tebakan |
| `budget_range` (`BudgetRange`) | dropdown | Rekomendasi realistis (feasibility), tak di luar jangkauan |
| `business_name` | text | Personalisasi laporan saja; tidak dipakai scraping |

### Kecukupan & UX
Tingkat 1 + 2 sudah **cukup**: scraping terarah, router punya konteks embedding, tiap agent tahu apa yang dibandingkan & untuk siapa. **Checkpoint Tahap 0** (`interpreted_summary`) jadi jaring pengaman — sistem menampilkan interpretasinya sebelum membakar compute, jadi salah tangkap ketahuan lebih awal.

**Saran layout:** Tingkat 1 di layar utama (barrier rendah) → Tingkat 2–3 di panel *"Tambah konteks (opsional)"* yang bisa dilipat. Konsisten dgn prinsip "sisi klien sesederhana mungkin".

**Contoh `interpreted_summary` yang di-generate** (dari stage=`idea`, goals=[validate_idea, know_competitors]):
> *"Kami akan **memvalidasi peluang** Kedai kopi specialty dalam radius 3km dari Cikarang Selatan, dengan fokus: validate_idea, know_competitors. Termasuk kompetitor lokal dan sentimen area sekitarnya."*

---

## 3. Peta Seam & Kepemilikan

```
[Indra: Frontend]
   │  REST (OpenAPI dari api_stub.py)
   ▼
[Razan: FastAPI + Orchestrator]───► Redis (job state + TTL buffer)
   │        │                          Qdrant (vektor)
   │        ├─ panggil ──► [Faiz: ScraperModule]  → RawDataItem[]
   │        ├─ panggil ──► [Izerhaf: DataRouter]  → RoutedDataItem[]   ◄── METRIK ROUTING
   │        ├─ panggil ──► [Izerhaf: Retriever + Rerank/Sentiment/SWOT Agent]
   │        └─ panggil ──► [Izerhaf: SummaryAgent] → Report
   ▼
[Indra: render Report + Heatmap]
```

Seam yang dibekukan (nama tipe di `contracts.py`):

| Seam | Dari → Ke | Kontrak |
|---|---|---|
| Input | Indra → Razan | `BusinessInput` (3 tingkat) → `CreateAnalysisResponse` (berisi `ScopeConfig`) |
| Scraping | Faiz → Router | `RawDataItem[]` |
| **Routing** | Router → Preprocess | `RoutedDataItem[]` (lihat §4) |
| RAG | Izerhaf internal | `Chunk`, `RetrievedChunk`, `Rerank*` |
| Agent | Izerhaf → Razan | `SentimentResult`, `SWOTResult` |
| Report | Razan → Indra | `Report`, `AnalysisStatusResponse` |

Kuncinya: **Faiz cuma perlu memproduksi `RawDataItem`** (tak perlu tahu track/preprocessing). **Indra cuma konsumsi 3 tipe** (`BusinessInput`, `AnalysisStatusResponse`, `Report`). Batas tanggung jawab jelas.

---

## 4. Metrik Routing — "penentu data masuk ke mana sebelum preprocessing"

Dimodelkan sebagai **gate + klasifikasi multi-label** yang **deterministik & explainable** (Bagian 6.3: jangan black box saat demo). Tipe: `RoutingScore`, `RoutingDecision`, `RoutedDataItem`, `RouterConfig`.

**Posisi:** persis antara Scraping (Faiz) dan Preprocessing. Logika dimiliki AI/ML (Izerhaf), di-wire Backend (Razan).

**Komponen metrik** (kuantitatif, murah, tanpa LLM call per-item):

| Komponen | Cara hitung | Fungsi |
|---|---|---|
| `relevance_score` [0–1] | cosine sim `embed(item.raw_text)` vs `embed(scope intent)` — pakai BGE-M3 yang sudah ada | Gerbang on/off-topic |
| `geo_match` | cocokkan `geo_hint` vs `scope.location` → exact/city/region/none | Bobot kedekatan geografis |
| `recency_score` [0–1] | decay eksponensial dari `published_at` (half-life default 180 hari) | Data baru lebih berbobot |
| `lang_ok` | `lang_hint ∈ {id, en}` | Buang noise bahasa lain |
| `is_duplicate` | hash + similarity ≥ 0.92 | Deduplikasi |
| `quality_score` | `0.5·relevance + 0.3·geo + 0.2·recency` | Bobot komposit → dipakai lagi di confidence |

**Aturan keputusan (urutan):**
```
1. is_duplicate                          → DISCARD("dup")
2. lang bukan {id,en} & relevance < 0.55 → DISCARD("foreign_lang")
3. relevance < tau_discard (0.35)        → DISCARD("off_topic")
4. selain itu, tetapkan track (multi-label) dari source_type:
     review / forum / social      → SENTIMENT
     places_listing               → SWOT (kompetitor)
     news / blog / article        → SWOT (+ SENTIMENT bila opini/geo cocok)
     trends / bps_stat / databoks → MARKET
```
Tiap keputusan menyimpan `reason` (mis. `"review+geo:city -> sentiment"`) → bisa ditampilkan di panel debug demo, dan angkanya (`relevance`, `geo`, `recency`) mengalir langsung jadi input kuantitatif untuk **confidence per-section** (Bagian 8.2). Satu metrik, dua kebutuhan: routing **dan** basis confidence.

**Item #5 di fixtures** (post kripto Inggris, 2024) sengaja dibuat untuk memverifikasi router membuangnya (off-topic + foreign + basi).

---

## 5. Kontrak REST (ringkas)

Dari `api_stub.py` (`uvicorn api_stub:app --reload`, buka `/docs`):

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/analyses` | Buat analisis → balikan `ScopeConfig` + `interpreted_summary` untuk **checkpoint konfirmasi** (Tahap 0) |
| POST | `/api/analyses/{id}/confirm` | User setuju → pipeline jalan |
| GET | `/api/analyses/{id}` | Polling `status` + `progress.pct` + `sections_ready` |
| GET | `/api/analyses/{id}/report` | Ambil `Report` (final/parsial + `degradation_notes`) |

`AnalysisStatus` enum memetakan stage pipeline → persen, jadi Indra bisa bikin progress bar tanpa nanya backend. Generate tipe: `npx openapi-typescript http://localhost:8000/openapi.json -o src/api.d.ts`.

---

## 6. Struktur Repo (monorepo)

```
boa/
├── contracts/          # SUMBER KEBENARAN — di-freeze duluan
│   ├── contracts.py    #   model data (BusinessInput 3-tingkat, dst)
│   ├── interfaces.py   #   Protocol per domain
│   └── api_stub.py     #   REST + kerangka orchestrator
├── fixtures/           # data contoh untuk kerja offline
├── backend/            # Razan: orchestrator, redis, qdrant, api nyata
├── scraping/           # Faiz: satu file per ScraperModule
├── ml/                 # Izerhaf: router, retriever, agents, model serving
└── frontend/           # Indra: React app
```
Semua Python service `import` dari `contracts/`. Frontend generate `api.d.ts` dari OpenAPI.

---

## 7. Yang bisa dikerjakan MASING-MASING di Hari-1 (tanpa saling tunggu)

**Indra (Frontend)** — jalankan `api_stub.py` sebagai backend palsu. Bangun: **form konteks 3-tingkat §2** (Tingkat 1 di layar utama; Tingkat 2–3 di panel lipat), layar **konfirmasi scope** (tampilkan `interpreted_summary`), progress UI (polling status), layout laporan + **MapLibre heatmap** dari GeoJSON dummy. Semua field & enum pasti dari OpenAPI.

**Razan (Backend)** — isi kerangka `_run_pipeline`. Hari-1: wire Redis (job state + TTL) & Qdrant (docker), sempurnakan `_build_scope` (keyword dari `target_customers`, framing dari `business_stage`), jalankan orchestrator dengan **MockScraper + MockAgent** (mengembalikan fixtures) → pipeline end-to-end "hidup" sebelum kode nyata siap. Tukar mock satu per satu.

**Izerhaf (AI/ML)** — kerja dari `fixtures/raw_data_items.sample.json`, tak perlu Faiz. Hari-1: stand-up BGE-M3 + reranker + Qdrant di AMD Dev Cloud/ROCm; implement `DataRouter` (rule-based + embedding sim) & verifikasi item #5 ter-discard; implement Sentiment/SWOT agent yang baca `primary_goals`/`target_customers` dari scope & mengembalikan `*Result` valid.

**Faiz (Scraping)** — implement `ScraperModule` per sumber terhadap sumber live, tak bergantung siapa pun. Output: `RawDataItem[]`. Kontribusi krusial: **dump hasil nyata ke `fixtures/`** supaya makin realistis. Wajib circuit-breaker (return `[]` + log, jangan raise).

---

## 8. Milestone Integrasi

| Tahap | Target |
|---|---|
| **Jam-0** | Freeze `contracts/`. Semua `import` & generate tipe. Semua kerja vs mock/fixtures. |
| **Integrasi 1** | Faiz `RawDataItem` nyata → Router Izerhaf. Ganti fixtures dgn data live. |
| **Integrasi 2** | Agent Izerhaf nyata → orchestrator Razan (ganti MockAgent). |
| **Integrasi 3** | API Razan nyata → frontend Indra (ganti `api_stub`). |
| **Final** | 1 run end-to-end < 3–5 menit + heatmap tampil + graceful degradation teruji (matikan 1 sumber, laporan tetap keluar + disclosure). |

---

## 9. Biaya & kredit (jaga model bisnis masuk akal — NFR Bagian 11)
- Klaim **$50 kredit Fireworks** via AMD AI Developer Program untuk LLM inference.
- Instrumentasi: hitung `scraping API call` + `LLM call` per laporan (log di orchestrator) → tampilkan "biaya per laporan" untuk pitch juri.
- Places API pay-per-call: batasi via `radius_km` + hanya on-demand per request (sesuai TOS).

---

## 10. Ringkasan tipe kunci (`contracts.py` v1.1)

| Grup | Tipe |
|---|---|
| Enum baru v1.1 | `BusinessStage`, `PrimaryGoal`, `TargetCustomer`, `BudgetRange` |
| Input & scope | `BusinessInput` (3-tingkat), `ScopeConfig`, `Location`, `GeoPoint` |
| Scraping → routing | `RawDataItem`, `RoutingScore`, `RoutingDecision`, `RoutedDataItem`, `RouterConfig` |
| RAG | `Chunk`, `RetrievedChunk`, `RerankRequest/Response` |
| Agent output | `SentimentResult`, `SentimentPoint`, `SWOTResult`, `Competitor`, `SectionConfidence` |
| Report & API | `Report`, `Visualizations`, `CreateAnalysisResponse`, `AnalysisStatusResponse`, `ProgressStage` |

---

**Ringkas:** stack dipilih, form konteks didesain 3-tingkat & dibekukan ke `BusinessInput`, 6 seam jadi kode tervalidasi, metrik routing didesain sebagai gate+multi-label explainable, tiap orang punya jalur Hari-1 tanpa blocking. Prioritas tertinggi tetap: **end-to-end kecil yang jalan** > pipeline besar setengah jadi.