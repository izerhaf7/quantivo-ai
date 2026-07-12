"""
backend/store.py — JobStore: Redis-backed job/state store.

Replaces the in-memory _JOBS dict from the scaffold. One Redis hash per job
at key boa:job:{scope_id}, fields: status, scope (JSON), expires_at (ISO),
report (JSON or ""), sections_ready (JSON list), error (str or "").

TTL mirrors ScopeConfig.expires_at (48h buffer per spec) and is refreshed on
every write so an in-flight job doesn't expire mid-pipeline.

A separate sorted set (_INDEX_KEY, score = created_at epoch seconds) tracks
every scope_id ever created so History/Riwayat can list past analyses --
without it there is no way to enumerate jobs, only to fetch one by id.
Trimmed to _INDEX_MAX entries on every create() so it can't grow unbounded;
entries whose job hash has since expired are lazily pruned in
list_summaries() instead of tracked with their own TTL.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import redis.asyncio as redis

from contracts import AnalysisStatus, AnalysisSummary, Report, ScopeConfig

_INDEX_KEY = "boa:jobs:index"
_INDEX_MAX = 200


def _key(scope_id: str) -> str:
    return f"boa:job:{scope_id}"


class JobStore:
    def __init__(self, redis_url: str):
        self._redis = redis.Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )

    async def close(self) -> None:
        await self._redis.aclose()

    async def ping(self) -> bool:
        try:
            return bool(await self._redis.ping())
        except Exception:  # noqa: BLE001
            return False

    async def create(self, scope: ScopeConfig) -> None:
        key = _key(scope.scope_id)
        await self._redis.hset(key, mapping={
            "status": AnalysisStatus.AWAITING_CONFIRMATION.value,
            "scope": scope.model_dump_json(),
            "expires_at": scope.expires_at.isoformat(),
            "report": "",
            "sections_ready": json.dumps([]),
            "error": "",
        })
        await self._refresh_ttl(scope.scope_id)
        await self._redis.zadd(_INDEX_KEY, {scope.scope_id: scope.created_at.timestamp()})
        await self._redis.zremrangebyrank(_INDEX_KEY, 0, -(_INDEX_MAX + 1))

    async def get(self, scope_id: str) -> dict | None:
        data = await self._redis.hgetall(_key(scope_id))
        if not data:
            return None
        return {
            "status": AnalysisStatus(data["status"]),
            "scope": ScopeConfig.model_validate_json(data["scope"]),
            "report": Report.model_validate_json(data["report"]) if data.get("report") else None,
            "sections_ready": json.loads(data.get("sections_ready") or "[]"),
            "error": data.get("error") or None,
        }

    async def get_status(self, scope_id: str) -> AnalysisStatus | None:
        status = await self._redis.hget(_key(scope_id), "status")
        return AnalysisStatus(status) if status else None

    async def set_status(self, scope_id: str, status: AnalysisStatus) -> None:
        await self._redis.hset(_key(scope_id), "status", status.value)
        await self._refresh_ttl(scope_id)

    async def set_sections_ready(self, scope_id: str, sections: list[str]) -> None:
        await self._redis.hset(_key(scope_id), "sections_ready", json.dumps(sections))
        await self._refresh_ttl(scope_id)

    async def set_report(self, scope_id: str, report: Report) -> None:
        await self._redis.hset(_key(scope_id), "report", report.model_dump_json())
        await self._refresh_ttl(scope_id)

    async def set_error(self, scope_id: str, message: str) -> None:
        await self._redis.hset(_key(scope_id), "error", message)
        await self._refresh_ttl(scope_id)

    async def list_summaries(self, limit: int = 50) -> list[AnalysisSummary]:
        """Most-recent-first summaries for GET /api/analyses (History).

        Reads the index newest-first, skipping (and pruning) any scope_id
        whose job hash has already expired out of Redis.
        """
        scope_ids = await self._redis.zrevrange(_INDEX_KEY, 0, limit - 1)
        summaries: list[AnalysisSummary] = []
        for scope_id in scope_ids:
            job = await self.get(scope_id)
            if job is None:
                await self._redis.zrem(_INDEX_KEY, scope_id)
                continue
            report = job["report"]
            sentiment_distribution = None
            sentiment_confidence = None
            swot_confidence = None
            executive_summary = None
            if report is not None:
                executive_summary = report.executive_summary or None
                if report.sentiment is not None:
                    sentiment_distribution = report.sentiment.overall_distribution
                    sentiment_confidence = report.sentiment.confidence.score
                if report.swot is not None:
                    swot_confidence = report.swot.confidence.score
            summaries.append(AnalysisSummary(
                analysis_id=scope_id,
                business_type=job["scope"].business_input.business_type,
                location=job["scope"].business_input.location,
                category=job["scope"].business_input.category,
                status=job["status"],
                created_at=job["scope"].created_at,
                sentiment_distribution=sentiment_distribution,
                sentiment_confidence=sentiment_confidence,
                swot_confidence=swot_confidence,
                executive_summary=executive_summary,
            ))
        return summaries

    async def _refresh_ttl(self, scope_id: str) -> None:
        expires_raw = await self._redis.hget(_key(scope_id), "expires_at")
        if not expires_raw:
            return
        expires_at = datetime.fromisoformat(expires_raw)
        ttl_seconds = int((expires_at - datetime.now(timezone.utc)).total_seconds())
        if ttl_seconds > 0:
            await self._redis.expire(_key(scope_id), ttl_seconds)
