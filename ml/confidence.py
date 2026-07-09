"""
ml/confidence.py — Confidence PER-SECTION dari basis KUANTITATIF.

Bagian 8.2 spesifikasi: DILARANG angka confidence yang di-generate subjektif
oleh LLM. Skor di sini murni fungsi dari (jumlah_sumber, kesepakatan, recency).
"""
from __future__ import annotations

from contracts import SectionConfidence


def compute_confidence(
    *, source_count: int, agreement: float, recency: float, k: int = 8
) -> SectionConfidence:
    """
    source_count : jumlah sumber unik yang menopang section.
    agreement    : [0..1] tingkat kesepakatan antar-sumber.
    recency      : [0..1] rata-rata skor kesegaran data.
    k            : titik saturasi kecukupan sumber (~0.5 saat source_count==k).
    """
    src_sufficiency = source_count / (source_count + k) if source_count else 0.0
    score = 0.5 * agreement + 0.3 * src_sufficiency + 0.2 * recency

    if source_count == 0:
        note = "tidak ada sumber"
    elif agreement >= 0.6:
        note = f"{source_count} sumber, mayoritas sepakat"
    elif agreement >= 0.4:
        note = f"{source_count} sumber, sumber terbagi"
    else:
        note = f"{source_count} sumber, data terbatas"

    return SectionConfidence(
        score=round(score, 2),
        source_count=source_count,
        agreement=round(agreement, 2),
        recency=round(recency, 2),
        explanation=note,
    )


def majority_share(labels: list[str]) -> float:
    """Proksi 'agreement' untuk sentimen: porsi label mayoritas."""
    if not labels:
        return 0.0
    return max(labels.count(x) for x in set(labels)) / len(labels)


def mean_recency(scores: list[float]) -> float:
    return sum(scores) / len(scores) if scores else 0.0
