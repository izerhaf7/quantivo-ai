"""
ml/retriever.py — QdrantRetriever: implementasi nyata interfaces.Retriever
(hybrid dense+sparse BGE-M3, payload filter per track — Bagian 1 & 3 spesifikasi).

Titik swap dari MockRetriever (ml/run_demo.py): signature identik dgn Protocol
di interfaces.py, jadi graph.py/agents.py TIDAK BERUBAH sama sekali saat ditukar.
"""
from __future__ import annotations

from contracts import AnalysisTrack, Chunk, RetrievedChunk, ScopeConfig
from embeddings import EmbeddingClient


class QdrantRetriever:
    """
    Hybrid retriever: dense (BGE-M3) + sparse (BGE-M3 lexical weights),
    digabung via RRF, difilter payload `track` (wajib per Protocol).

    Vektor dihitung oleh `embedder` (Protocol di embeddings.py) — retriever ini
    tidak tahu/tidak peduli BGE-M3 asli vs mock vs server mana.

    `location=":memory:"` menjalankan Qdrant in-process (tanpa server),
    dipakai `retriever_demo.py` untuk verifikasi wiring. Produksi: beri `url`
    ke instance Qdrant (docker/AMD Dev Cloud) dan biarkan `location=None`.
    """

    def __init__(
        self,
        embedder: EmbeddingClient,
        url: str = "http://localhost:6333",
        collection: str = "boa_chunks",
        location: str | None = None,
        api_key: str | None = None,
    ):
        from qdrant_client import AsyncQdrantClient  # lazy import

        self.embedder = embedder
        self.collection = collection
        self.client = AsyncQdrantClient(
            location=location, url=None if location else url, api_key=api_key)
        self._ensured = False

    async def _ensure_collection(self) -> None:
        if self._ensured:
            return
        from qdrant_client import models

        if not await self.client.collection_exists(self.collection):
            await self.client.create_collection(
                collection_name=self.collection,
                vectors_config={
                    "dense": models.VectorParams(
                        size=self.embedder.dense_dim, distance=models.Distance.COSINE),
                },
                sparse_vectors_config={"sparse": models.SparseVectorParams()},
            )
            await self.client.create_payload_index(
                self.collection, field_name="track",
                field_schema=models.PayloadSchemaType.KEYWORD)
            await self.client.create_payload_index(
                self.collection, field_name="geo_city",
                field_schema=models.PayloadSchemaType.KEYWORD)
        self._ensured = True

    async def ingest(self, chunks: list[Chunk]) -> int:
        from qdrant_client import models

        if not chunks:
            return 0
        await self._ensure_collection()
        vectors = await self.embedder.embed([c.text for c in chunks])

        points = []
        for chunk, vec in zip(chunks, vectors):
            vector: dict = {"dense": vec.dense}
            if vec.sparse:
                vector["sparse"] = models.SparseVector(
                    indices=list(vec.sparse.keys()), values=list(vec.sparse.values()))
            points.append(models.PointStruct(
                id=chunk.chunk_id,
                vector=vector,
                payload={
                    "track": chunk.track.value,
                    "geo_city": (chunk.geo_tag.city.lower() if chunk.geo_tag else None),
                    "chunk": chunk.model_dump(mode="json"),
                },
            ))
        await self.client.upsert(self.collection, points=points)
        return len(points)

    async def retrieve(
        self, query: str, scope: ScopeConfig, track: AnalysisTrack, top_k: int = 30
    ) -> list[RetrievedChunk]:
        from qdrant_client import models

        await self._ensure_collection()
        [qvec] = await self.embedder.embed([query])

        query_filter = models.Filter(must=[
            models.FieldCondition(key="track", match=models.MatchValue(value=track.value)),
        ])

        prefetch = [
            models.Prefetch(query=qvec.dense, using="dense",
                             limit=top_k * 2, filter=query_filter),
        ]
        if qvec.sparse:
            prefetch.append(models.Prefetch(
                query=models.SparseVector(
                    indices=list(qvec.sparse.keys()), values=list(qvec.sparse.values())),
                using="sparse", limit=top_k * 2, filter=query_filter))

        result = await self.client.query_points(
            collection_name=self.collection,
            prefetch=prefetch,
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=top_k,
            with_payload=True,
        )

        return [
            RetrievedChunk(chunk=Chunk(**point.payload["chunk"]),
                            dense_score=point.score, sparse_score=None)
            for point in result.points
        ]
