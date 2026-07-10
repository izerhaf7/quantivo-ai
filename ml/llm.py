"""
ml/llm.py — Abstraksi LLM client untuk agent layer.

Semua agent bergantung pada Protocol LLMClient, BUKAN vendor tertentu.
Jadi kita bisa:
  - MockLLMClient  -> jalan offline (demo/test, tanpa API key)
  - FireworksLLMClient -> produksi (OpenAI-compatible, jalan di AMD Instinct)

Ganti client = 1 baris di wiring graph. Tak menyentuh logika agent.
"""
from __future__ import annotations

import json
import os
from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class LLMClient(Protocol):
    async def complete_json(
        self, *, system: str, user: str, task: str
    ) -> Any:
        """Kembalikan objek Python (dict/list) hasil parse JSON dari model.
        `task` = penanda ringkas (mis. 'sentiment_classify') untuk logging /
        dispatch mock. Implementasi produksi WAJIB memaksa output JSON valid."""
        ...


# ---------------------------------------------------------------------------
# PRODUKSI — Fireworks (OpenAI-compatible). Jalan di AMD MI300X/MI350.
# ---------------------------------------------------------------------------
class FireworksLLMClient:
    """
    Butuh env FIREWORKS_API_KEY. Pakai endpoint OpenAI-compatible Fireworks.
    Model default bisa dioverride per-agent (reasoning besar vs kecil).
    """
    BASE_URL = "https://api.fireworks.ai/inference/v1/chat/completions"

    def __init__(self, model: str = "accounts/fireworks/models/llama-v3p3-70b-instruct",
                 api_key: str | None = None, temperature: float = 0.2):
        self.model = model
        self.api_key = api_key or os.environ.get("FIREWORKS_API_KEY", "")
        self.temperature = temperature

    async def complete_json(self, *, system: str, user: str, task: str) -> Any:
        import httpx  # lokal agar mock tak butuh httpx
        payload = {
            "model": self.model,
            "temperature": self.temperature,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        headers = {"Authorization": f"Bearer {self.api_key}",
                   "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=60) as cx:
            r = await cx.post(self.BASE_URL, json=payload, headers=headers)
            r.raise_for_status()
            content = r.json()["choices"][0]["message"]["content"]
        return json.loads(content)


# ---------------------------------------------------------------------------
# DEMO/TEST — Mock deterministik. Menghasilkan output plausibel dari input,
# supaya graph bisa jalan end-to-end tanpa API key.
# ---------------------------------------------------------------------------
class MockLLMClient:
    async def complete_json(self, *, system: str, user: str, task: str) -> Any:
        if task == "sentiment_classify":
            return self._sentiment(user)
        if task == "swot_synthesize":
            return self._swot(user)
        if task == "summary_compose":
            return self._summary(user)
        return {}

    # heuristik kata kunci sederhana, cukup untuk demo
    @staticmethod
    def _sentiment(user: str) -> dict:
        pos = sum(w in user.lower() for w in ["enak", "nyaman", "ramah", "bagus", "naik", "meningkat"])
        neg = sum(w in user.lower() for w in ["mahal", "ramai", "antre", "lama", "turun", "sepi"])
        label = "positive" if pos >= neg else ("negative" if neg > pos else "neutral")
        score = round(min(1.0, 0.2 + 0.2 * pos) - min(1.0, 0.2 * neg), 2)
        return {"label": label, "score": score, "demographics": None}

    @staticmethod
    def _swot(user: str) -> dict:
        return {
            "strengths": ["Konsep produk sesuai minat segmen pekerja/mahasiswa"],
            "weaknesses": ["Brand belum dikenal di area target"],
            "opportunities": ["Permintaan kedai kopi di area industri sedang naik"],
            "threats": ["Kepadatan kompetitor dengan rating tinggi di sekitar lokasi"],
        }

    @staticmethod
    def _summary(user: str) -> dict:
        return {
            "executive_summary": "Peluang layak divalidasi lebih lanjut: minat pasar "
                                 "positif namun kompetisi lokal cukup padat.",
            "narrative": "Sentimen area cenderung positif terhadap kategori ini. "
                         "Kompetitor lokal punya rating baik, sehingga diferensiasi "
                         "produk dan konsistensi jadi kunci. Data makro menunjukkan "
                         "daya beli segmen target memadai.",
            "market_insights": ["Daya beli segmen target memadai untuk harga menengah",
                                "Tren kategori di kawasan sekitar sedang meningkat"],
            "recommendations": ["Fokus diferensiasi (jam buka / produk khas) vs kompetitor",
                                "Uji lokasi dengan traffic pekerja tertinggi lebih dulu"],
        }


