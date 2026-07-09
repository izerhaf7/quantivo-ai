# Spesifikasi Teknis — Business Opportunity Analysis (BOA) SaaS
**Proyek:** AMD Developer Hackathon: ACT II — Track Unicorn
**Versi:** 1.0 (Draft Realistis Pasca-Review)
**Tanggal:** 8 Juli 2026

---

## 1. Ringkasan Eksekutif

Sistem ini adalah SaaS yang menghasilkan laporan **Business Opportunity Analysis** terpersonalisasi untuk UMKM atau perusahaan skala kecil-menengah di Indonesia, berdasarkan deskripsi bisnis dan lokasi yang diinput klien. Sistem menggabungkan analisis sentimen geo-demografis, riset SWOT berbasis kompetitor lokal, dan insight pasar — diproses melalui pipeline multi-agent dengan RAG (Retrieval-Augmented Generation).

**Diferensiator utama:** fokus pada geo-sentiment heatmap untuk konteks lokal Indonesia — sebuah niche yang belum tergarap dengan baik oleh kompetitor eksisting (Manus, IdeaProof, GrowthGrid, Sai by Simular, dll., yang umumnya berorientasi pasar B2B/SaaS global, bukan UMKM lokal Indonesia).

**Prinsip desain:** beban komputasi dan keputusan riset ada di sisi backend (scraping + AI agent), sisi klien tetap sesederhana mungkin (satu form input → satu laporan output).

---

## 2. Ruang Lingkup

### 2.1 MVP Hackathon (target: selesai dalam sisa waktu hackathon)
Scope dipersempit secara sengaja agar bisa didemokan end-to-end dan tidak terjebak di "half-built pipeline."

| Termasuk MVP | Ditunda / Di luar MVP |
|---|---|
| Input form (deskripsi bisnis + lokasi + kategori) | Business Pitch Deck generator (fitur commodity, banyak kompetitor) |
| Sentimen dari web search + berita + Google Trends | Sentimen dari X/Twitter (biaya & legal tidak layak untuk 1 minggu) |
| SWOT dari web search + Places API (read-only, tanpa storage jangka panjang) | Riset jurnal/artikel akademik mendalam (nice-to-have) |
| RAG sederhana (chunking + reranker) | Full Contextual Retrieval Anthropic (per-chunk LLM call, mahal secara token/waktu) |
| Full report analysis (naratif gabungan) | Dashboard analitik interaktif multi-user |
| 1 visualisasi utama: heatmap sentimen geografis | Multi-bahasa selain Indonesia/Inggris |
| Confidence score per-section (bukan 1 angka global) | Sistem akun/billing multi-tenant penuh |

### 2.2 Roadmap Pasca-Hackathon (Full Product)
Ditulis di Bagian 12 sebagai referensi arah pengembangan, bukan target hackathon.

---

## 3. Arsitektur Sistem (High-Level)

```
[Client Form] 
     │  (deskripsi bisnis, lokasi, kategori, scope)
     ▼
[API Gateway / Orchestrator]
     │
     ├──► [Scraping Service] ──► [Raw Data Buffer (temp, TTL 24-72 jam)]
     │         │
     │         ├─ Web Search Module (berita, tren, artikel publik)
     │         ├─ Google Trends Module
     │         ├─ Places API Module (on-demand, no long-term storage)
     │         └─ BPS/Databoks Module (statistik makro & UMKM)
     │
     ▼
[Preprocessing & Validation]
     │  (dedup, filter noise, deteksi bahasa, normalisasi)
     ▼
[RAG Ingestion Pipeline] ──► [Vector DB (embeddings)] + [BM25 Index]
     │
     ▼
[Agent Orchestration Layer]
     │
     ├─ Sentiment Agent      (geo + demografi classification)
     ├─ SWOT Agent           (kompetitor + produk + riset pasar)
     ├─ Rerank Agent         (top-k/top-p filtering hasil retrieval)
     └─ Summary Agent        (sintesis lintas-agent)
     ▼
[Report Composer] ──► [Confidence Scorer] ──► [Output Renderer]
     │
     ▼
[Client: Full Report + Sentiment Heatmap + Data Viz]
```

**Prinsip arsitektur kunci:**
- Setiap panggilan API eksternal (Maps, X, dsb.) **stateless per-request** — tidak ada penyimpanan konten mentah pihak ketiga secara permanen (lihat Bagian 5.3 soal kepatuhan TOS).
- Buffer data mentah punya **TTL (time-to-live)** otomatis, bukan penyimpanan permanen.
- Agent-agent berjalan **paralel di mana mungkin** (Sentiment Agent dan SWOT Agent independen satu sama lain) untuk menekan latensi total.

---

## 4. Alur Data & Pipeline Detail

### Tahap 0 — Input & Validasi Scope
- Form input wajib: nama/jenis bisnis, deskripsi produk/jasa, lokasi (kota/kecamatan), kategori industri (dropdown terstruktur, bukan free-text saja — untuk memudahkan query scraping terarah).
- **Checkpoint konfirmasi:** sistem menampilkan ringkasan interpretasi input (contoh: "Kami akan menganalisis: kompetitor kedai kopi dalam radius 3km dari [lokasi]") sebelum lanjut ke scraping — mencegah AI salah asumsi dan buang compute di awal.
- Output tahap ini: `ScopeConfig` (JSON terstruktur) yang jadi parameter semua agent berikutnya.

### Tahap 1 — Scraping Data
| Sub-modul | Sumber | Metode | Catatan Legal |
|---|---|---|---|
| Web search & berita | Google/Bing search API, RSS berita lokal | Query terarah per kategori bisnis + lokasi | Aman — hasil publik, tidak perlu caching agresif |
| Tren pasar | Google Trends API | Query per kata kunci produk | Gratis, aman |
| Geo-sentiment | Google Places API | On-demand per request, **tidak menyimpan raw review** | Wajib patuh TOS: dilarang cache/scrape konten Maps di luar sesi, kecuali place_id yang boleh disimpan permanen |
| Statistik makro/UMKM | BPS, Databoks | Query terjadwal (bukan real-time per klien) | Data publik resmi, aman |
| ~~Medsos X/Twitter~~ | ~~X API~~ | **Tidak digunakan di MVP** | Biaya tinggi ($100–5000+/bulan) & scraping langsung dilarang TOS X |

**Rate limiting & retry policy:** setiap sub-modul punya circuit breaker — jika satu sumber gagal/limit habis, pipeline lanjut dengan sumber yang tersedia (graceful degradation), bukan gagal total.

### Tahap 2 — Preprocessing
- Deduplikasi konten (hash-based + semantic similarity threshold).
- Filter bahasa (fokus ID/EN, buang noise bahasa lain).
- Ekstraksi metadata: lokasi geografis, tanggal publikasi, sumber, kategori awal (sentimen/SWOT).

### Tahap 3 — RAG Ingestion
- Chunking dokumen (ukuran ~300-500 token per chunk).
- **MVP:** embedding langsung + BM25 index (tanpa contextualization per-chunk, demi kecepatan build).
- **Versi lanjutan (pasca-hackathon):** tambahkan Contextual Retrieval — setiap chunk diberi context snippet dari LLM murah sebelum di-embed, terbukti mengurangi kegagalan retrieval top-20 secara signifikan berdasarkan riset Anthropic.
- Reranking top-k/top-p dilakukan oleh **Rerank Agent** sebelum masuk ke agent analisis.

### Tahap 4 — Agent Processing
Detail tiap agent ada di Bagian 6.

### Tahap 5 — Report Composition
- Summary Agent menggabungkan output Sentiment Agent + SWOT Agent → narasi terstruktur.
- Confidence Scorer menghitung skor **per section** (lihat Bagian 8.2), bukan satu angka global.
- Output Renderer merender ke format final (Markdown/HTML untuk web, opsional PDF export).

---

## 5. Sumber Data & Constraints Legal

### 5.1 Tabel Sumber Data

| Sumber | Jenis Data | Biaya (perkiraan) | Batasan Kunci |
|---|---|---|---|
| Web Search API | Berita, artikel, tren | Rendah–menengah, tergantung provider | Rate limit per menit |
| Google Trends | Minat pencarian per kata kunci/wilayah | Gratis | Granularitas terbatas untuk wilayah kecil |
| Google Places API | Rating, jumlah ulasan (agregat), lokasi kompetitor | Pay-per-call | **Dilarang cache/scrape/simpan konten (nama bisnis, alamat, ulasan) di luar sesi**, kecuali place_id boleh disimpan permanen; caching konten lain maksimal 30 hari untuk tujuan performa saja |
| BPS / Databoks | Statistik ekonomi, UMKM, demografi | Gratis (publik) | Update tidak real-time, granularitas kabupaten/kota, bukan hyper-lokal |
| X/Twitter API | Sentimen medsos | **Ditunda** — $100–5000+/bulan, tanpa free tier layak | Scraping langsung dilarang TOS |

### 5.2 Data Tambahan yang Direkomendasikan (belum ada di pipeline awal)
- Data demografi & daya beli lokal (BPS/Databoks per provinsi/kota).
- Data kepadatan aktivitas area (Places API "popular times" sebagai proxy traffic).
- Data regulasi/perizinan lokal dasar (sumber: portal OSS/pemerintah daerah) — sering jadi item SWOT (Threat/Weakness) yang terlewat kalau hanya andalkan web search umum.

### 5.3 Kepatuhan (Compliance) — Wajib Dibaca Tim
- **Places API:** arsitektur penyimpanan HARUS punya expiry policy otomatis untuk konten (bukan place_id). Jangan bangun database permanen dari hasil scraping ulasan — ini pelanggaran kontrak (bukan pidana, tapi bisa kena suspend akun API kapan saja).
- **X/Twitter:** tidak digunakan di MVP. Jika akan dipakai di roadmap lanjutan, gunakan API resmi berbayar, bukan scraping langsung.
- Disclaimer legal di UI produk: "Insight dihasilkan dari sumber publik dan model AI, bukan pengganti riset pasar profesional atau nasihat hukum/keuangan."

---

## 6. Spesifikasi Agent AI

### 6.1 Sentiment Agent
- **Input:** chunk terklasifikasi dari RAG (kategori: medsos/berita/review), `ScopeConfig`.
- **Tugas:** klasifikasi sentimen (positif/netral/negatif) + tagging geografis (kecamatan/kota) dan demografis (jika data tersedia — umur, gender, hanya jika sumber punya sinyal ini, tidak boleh diasumsikan/di-generate).
- **Output:** `SentimentResult { location, sentiment_score, sample_size, confidence }`.
- **Constraint penting:** JANGAN generate demografi fiktif jika data sumber tidak menyediakannya — lebih baik `null`/"data tidak tersedia" daripada estimasi tanpa dasar.

### 6.2 SWOT Agent
- **Input:** chunk kompetitor (geo-based), deskripsi produk klien dari form, hasil riset pasar dari RAG.
- **Tugas:** riset kompetitor lokal (nama, kategori, rating agregat — **bukan quote ulasan verbatim**), sintesis SWOT 4 kuadran.
- **Output:** `SWOTResult { strengths[], weaknesses[], opportunities[], threats[], competitor_list[], confidence }`.

### 6.3 Rerank Agent
- **Tugas:** memfilter top-k/top-p chunk hasil retrieval berdasarkan relevansi ke `ScopeConfig` (bukan hanya similarity score mentah).
- **Kriteria rerank yang harus didefinisikan eksplisit** (agar tidak jadi black box saat demo): relevansi kategori bisnis, kedekatan geografis, recency data (bobot lebih tinggi untuk data <6 bulan).

### 6.4 Summary Agent
- **Input:** output Sentiment Agent + SWOT Agent + data pasar mentah.
- **Tugas:** sintesis naratif full report, memastikan konsistensi antar-section (misal: SWOT "Threat: kompetitor padat" harus konsisten dengan data sentimen kompetitor di area sama).
- **Output:** draft laporan lengkap + insight market.

---

## 7. RAG & Retrieval — Spesifikasi Teknis

| Komponen | MVP Hackathon | Versi Lanjutan |
|---|---|---|
| Chunking | Fixed-size (~400 token), overlap 10-15% | Semantic chunking |
| Embedding | Model embedding standar (mis. via Fireworks AI / open model on ROCm) | Sama, tetap open model untuk cost efficiency |
| Index | Vector similarity + BM25 hybrid | Sama |
| Contextualization | Tidak ada (langsung embed) | Contextual Retrieval — tiap chunk diberi context snippet dari LLM kecil sebelum embed |
| Reranking | Cross-encoder ringan atau LLM-based scoring | Sama, ditambah kriteria recency & geo-relevansi |
| Top-K ke LLM akhir | ~10-15 chunk | ~20 chunk (riset Anthropic menunjukkan top-20 lebih efektif dari top-5/10) |

**Catatan biaya:** Contextual Retrieval penuh butuh 1 LLM call per chunk (memasukkan seluruh dokumen sebagai konteks) — ini mahal secara token dan waktu. Untuk 1 minggu hackathon, ini di luar scope; cukup dicatat di dokumen roadmap sebagai peningkatan kualitas retrieval di masa depan.

---

## 8. Spesifikasi Output

### 8.1 Format Laporan
- **Full Report Analysis** (utama): dokumen terstruktur berisi ringkasan eksekutif, sentimen (dengan heatmap), SWOT, insight market, rekomendasi.
- **Sentiment Heatmap**: visualisasi peta dengan gradasi warna berdasarkan skor sentimen per area geografis.
- **Data Viz pendukung**: grafik distribusi sentimen, tabel kompetitor.
- Format ekspor: Markdown/HTML (web-native, cepat dibangun) — PDF/PPTX opsional jika waktu memungkinkan.

### 8.2 Metodologi Confidence Score (revisi penting dari desain awal)
Desain awal ("1 angka confidence 0-100% di akhir") berisiko *false precision* — angka yang terlihat presisi tapi tidak berdasar. Revisi:
- Confidence dihitung **per section**, bukan satu angka global.
- Formula sederhana (contoh, bisa disesuaikan): `confidence = f(jumlah_sumber, tingkat_kesepakatan_antar_sumber, recency_data)`.
- Contoh tampilan: "Sentimen: 85% (12 sumber, mayoritas sepakat)" vs "Kompetitor: 40% (3 sumber, data terbatas)".
- **Wajib:** confidence TIDAK boleh berupa angka yang di-generate subjektif oleh LLM tanpa basis kuantitatif yang jelas.

---

## 9. Tech Stack (Konteks AMD Hackathon)

| Layer | Rekomendasi |
|---|---|
| Compute | AMD Developer Cloud + ROCm (sesuai kredit hackathon) |
| LLM Inference | Model open-source (Llama/Qwen/Gemma) via Fireworks AI API pada AMD hardware, atau Claude API untuk agent yang butuh reasoning kompleks (SWOT/Summary) jika budget API memungkinkan |
| Embedding | Model embedding open-source yang kompatibel ROCm |
| Vector DB | Solusi ringan (mis. Chroma/Qdrant) — cukup untuk skala demo |
| Backend orchestration | Python (FastAPI) + framework agent (LangChain/CrewAI/AutoGen — sesuai rekomendasi track hackathon) |
| Frontend | Web app ringan untuk form input + render laporan |
| Storage sementara | Redis/objek storage dengan TTL otomatis (bukan DB permanen untuk raw scraped content) |

---

## 10. Skema Data (Ringkas)

```
ScopeConfig {
  business_type: string
  description: string
  location: { city, district, coordinates }
  category: enum
  created_at: timestamp
  expires_at: timestamp   // untuk raw data buffer
}

SentimentResult {
  scope_id: ref
  location_tag: string
  sentiment_score: float
  sample_size: int
  sources: string[]        // hanya nama sumber, bukan konten mentah tersimpan
  confidence: float
}

SWOTResult {
  scope_id: ref
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
  competitors: { name, category, rating_aggregate, place_id }[]  // place_id boleh disimpan permanen, konten lain tidak
  confidence: float
}

Report {
  scope_id: ref
  sentiment: SentimentResult
  swot: SWOTResult
  narrative: text
  visualizations: [ heatmap_url, chart_url ]
  generated_at: timestamp
}
```

---

## 11. Non-Functional Requirements

| Aspek | Target MVP |
|---|---|
| Waktu proses laporan | < 3-5 menit end-to-end (batas wajar untuk demo) |
| Graceful degradation | Sistem tetap menghasilkan laporan parsial + disclosure jujur jika 1 sumber data gagal |
| Keamanan data klien | Deskripsi bisnis klien tidak dibagikan ke pihak ketiga di luar API call yang diperlukan |
| Biaya per laporan | Dihitung & dimonitor eksplisit (jumlah API call scraping + LLM call agent) agar model bisnis masuk akal pasca-hackathon |
| Bahasa | Indonesia (utama), Inggris (opsional) |

---

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Pelanggaran TOS Places API (caching konten) | Suspend akun API | Arsitektur stateless + TTL, hanya simpan place_id & insight teragregasi |
| Biaya X API terlalu tinggi | Budget hackathon habis / fitur tidak bisa didemokan | Tidak pakai X di MVP, ganti web search + Trends |
| Data UMKM lokal minim jejak digital | Laporan kosong/tidak informatif | Fallback eksplisit: laporan tetap tampil dengan disclosure "data terbatas untuk area ini", bukan AI mengarang insight |
| Single point of failure di scraping | Seluruh pipeline gagal | Circuit breaker per sumber, degradasi bertahap |
| False precision confidence score | Laporan menyesatkan pengguna, berisiko keputusan bisnis salah | Confidence dihitung per-section dari basis kuantitatif, bukan estimasi subjektif LLM |
| Scope terlalu luas untuk waktu hackathon tersisa | Demo tidak selesai/tidak jalan end-to-end | Scope MVP dipangkas sesuai Bagian 2.1, prioritas: Full Report + Heatmap saja |

---

## 13. Roadmap Pasca-Hackathon (Referensi, di Luar Scope MVP)

1. Integrasi Contextual Retrieval penuh untuk akurasi RAG lebih tinggi.
2. Evaluasi sumber sentimen medsos berbayar (X Enterprise atau alternatif seperti Instagram/TikTok) dengan model bisnis yang menutup biayanya.
3. Business Pitch Deck generator sebagai fitur tambahan (bukan core).
4. Sistem akun multi-tenant, billing per laporan/subscription.
5. Ekspansi sumber data: data OSS/perizinan daerah, data harga sewa komersial lokal.
6. Dashboard historis — bandingkan laporan yang sama dari waktu ke waktu untuk klien yang sama.

---

## 14. Catatan Penutup

Dokumen ini disusun untuk mempersempit scope pipeline awal menjadi sesuatu yang **realistis dikerjakan dan didemokan** dalam sisa waktu hackathon, sambil tetap menjaga diferensiasi utama (geo-sentiment lokal Indonesia) sebagai nilai jual ke juri. Prioritas tertinggi: pipeline end-to-end yang jalan dengan scope kecil, lebih baik daripada pipeline besar yang setengah jadi.
