"""
backend/mocks.py — offline default Retriever (interfaces.Retriever).

Holds the Chunks for ONE pipeline run. A new instance is constructed per
job in orchestrator.py — never shared across concurrent analyses, since
retrieve() has no scope-filtering of its own (this part mirrors
ml/run_demo.py's inline MockRetriever). ingest() here is NOT a mirror,
though: it actually extends self.chunks, unlike run_demo.py's no-op
version -- orchestrator.py never calls ingest() today (chunks go straight
into the constructor), so this is currently dormant, but don't assume the
two MockRetrievers are interchangeable. Swap point for production:
ml/retriever.py's QdrantRetriever.
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
