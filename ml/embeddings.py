"""
ml/embeddings.py — Abstraksi embedding client (dense + sparse, BGE-M3) untuk retriever.

Pola sama seperti llm.py: retriever (QdrantRetriever di retriever.py) bergantung
pada Protocol EmbeddingClient, BUKAN vendor/model tertentu. Ganti client = 1
baris di wiring; retriever/graph/agent tidak berubah.
"""
from __future__ import annotations

import hashlib
import os
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@dataclass
class EmbeddingVector:
    dense: list[float]
    sparse: dict[int, float] | None = None


@runtime_checkable
class EmbeddingClient(Protocol):
    dense_dim: int

    async def embed(self, texts: list[str]) -> list[EmbeddingVector]:
        """Satu EmbeddingVector per teks input, urutan dipertahankan."""
        ...


# ---------------------------------------------------------------------------
# PRODUKSI — server BGE-M3 self-host (mis. Infinity / text-embeddings-inference)
# di AMD Developer Cloud + ROCm. Sesuaikan endpoint & bentuk response dgn
# kontrak server yang benar-benar dideploy tim (ini kerangka, bukan API final).
# ---------------------------------------------------------------------------
class TEIEmbeddingClient:
    """Butuh env EMBEDDING_BASE_URL. Endpoint diasumsikan menerima
    {"inputs": [...], "return_sparse": true} dan membalas list objek
    {"dense": [...], "sparse": {idx: val, ...}} — SESUAIKAN dgn server nyata."""

    dense_dim = 1024  # dimensi dense BGE-M3

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or os.environ.get(
            "EMBEDDING_BASE_URL", "http://localhost:7997")

    async def embed(self, texts: list[str]) -> list[EmbeddingVector]:
        import httpx  # lokal agar mock tak butuh httpx

        async with httpx.AsyncClient(timeout=30) as cx:
            r = await cx.post(f"{self.base_url}/embed",
                               json={"inputs": texts, "return_sparse": True})
            r.raise_for_status()
            data = r.json()
        return [
            EmbeddingVector(
                dense=item["dense"],
                sparse={int(i): float(v) for i, v in item.get("sparse", {}).items()} or None,
            )
            for item in data
        ]


# ---------------------------------------------------------------------------
# PRODUKSI (MVP) — Fireworks embeddings API (hosted, dense-only). Dipakai
# saat tak ada server BGE-M3 self-host (mis. deploy di box kecil tanpa GPU).
# Fireworks TIDAK expose BGE-M3 di akun ini (dicek langsung ke /v1/models);
# model dense-only yang tersedia & terverifikasi jalan: nomic-embed-text-v1.5
# (768 dim). QdrantRetriever/DataRouter sudah menangani sparse=None dengan
# baik (retriever.py hanya menambah leg sparse ke prefetch/point kalau ada),
# jadi retriever tetap search dense-only tanpa perlu ubah kode lain.
# ---------------------------------------------------------------------------
class FireworksEmbeddingClient:
    """Butuh env FIREWORKS_API_KEY. Model override via FIREWORKS_EMBEDDING_MODEL."""

    BASE_URL = "https://api.fireworks.ai/inference/v1/embeddings"
    dense_dim = 768  # nomic-ai/nomic-embed-text-v1.5

    def __init__(self, model: str | None = None, api_key: str | None = None):
        self.model = model or os.environ.get(
            "FIREWORKS_EMBEDDING_MODEL", "nomic-ai/nomic-embed-text-v1.5")
        self.api_key = api_key or os.environ.get("FIREWORKS_API_KEY", "")

    async def embed(self, texts: list[str]) -> list[EmbeddingVector]:
        import httpx  # lokal agar mock tak butuh httpx

        if not texts:
            return []
        headers = {"Authorization": f"Bearer {self.api_key}",
                   "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=30) as cx:
            r = await cx.post(self.BASE_URL, json={"model": self.model, "input": texts},
                               headers=headers)
            r.raise_for_status()
            data = r.json()["data"]
        # Fireworks membalas urut sesuai `index`, bukan selalu sesuai urutan
        # request -- urutkan eksplisit sebelum dipetakan balik ke `texts`.
        by_index = sorted(data, key=lambda d: d["index"])
        return [EmbeddingVector(dense=d["embedding"], sparse=None) for d in by_index]


# ---------------------------------------------------------------------------
# DEV LOKAL — BGE-M3 in-process via paket `FlagEmbedding`, tanpa server.
# Opsional & berat (unduh bobot ~2GB); lazy import supaya tak jadi dependensi
# wajib proyek. `uv add FlagEmbedding` dulu sebelum dipakai.
# ---------------------------------------------------------------------------
class LocalBGEM3EmbeddingClient:
    dense_dim = 1024

    def __init__(self, model_name: str = "BAAI/bge-m3", use_fp16: bool = False):
        from FlagEmbedding import BGEM3FlagModel  # lazy import, dependensi opsional

        self._model = BGEM3FlagModel(model_name, use_fp16=use_fp16)

    async def embed(self, texts: list[str]) -> list[EmbeddingVector]:
        import asyncio

        out = await asyncio.to_thread(
            self._model.encode, texts, return_dense=True, return_sparse=True)
        vectors = []
        for i in range(len(texts)):
            sparse_w = out["lexical_weights"][i]
            vectors.append(EmbeddingVector(
                dense=out["dense_vecs"][i].tolist(),
                sparse={int(k): float(v) for k, v in sparse_w.items()} or None))
        return vectors


# ---------------------------------------------------------------------------
# MOCK — deterministik, tanpa model/GPU. Untuk uji wiring QdrantRetriever
# (ingest + hybrid search + payload filter) tanpa bergantung bobot BGE-M3.
# ---------------------------------------------------------------------------
class MockEmbeddingClient:
    dense_dim = 256  # lebih besar dari versi kata-utuh biar tabrakan n-gram jarang
    _NGRAM = 3

    async def embed(self, texts: list[str]) -> list[EmbeddingVector]:
        return [self._vector(t) for t in texts]

    def _vector(self, text: str) -> EmbeddingVector:
        # Dense: hash CHARACTER TRIGRAM (bukan kata utuh) -> proyeksi
        # pseudo-random tapi deterministik. Trigram dipilih supaya varian
        # morfologis Bahasa Indonesia ("kopi" vs "kopinya") tetap berbagi
        # sebagian besar n-gram dan punya cosine similarity > 0 -- kalau
        # dihash per-kata-utuh, afiks bikin similarity jatuh ke 0 secara
        # keliru (lihat router_demo.py: false-discard sebelum fix ini).
        norm_text = " ".join(text.lower().split())
        dense = [0.0] * self.dense_dim
        grams = [norm_text[i:i + self._NGRAM]
                 for i in range(max(1, len(norm_text) - self._NGRAM + 1))]
        for g in grams:
            h = int(hashlib.md5(g.encode()).hexdigest(), 16)
            dense[h % self.dense_dim] += 1.0
        norm = sum(v * v for v in dense) ** 0.5 or 1.0
        dense = [v / norm for v in dense]

        sparse: dict[int, float] = {}
        for w in norm_text.split():
            h = int(hashlib.md5(("sparse:" + w).encode()).hexdigest(), 16)
            idx = h % 30000
            sparse[idx] = sparse.get(idx, 0.0) + 1.0
        return EmbeddingVector(dense=dense, sparse=sparse or None)
