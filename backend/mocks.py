"""
backend/mocks.py — offline default Retriever (interfaces.Retriever).

Holds the Chunks for ONE pipeline run. A new instance is constructed per
job in orchestrator.py — never shared across concurrent analyses, since
retrieve() has no scope-filtering of its own (mirrors ml/run_demo.py's
inline MockRetriever). Swap point for production: ml/retriever.py's
QdrantRetriever.
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
