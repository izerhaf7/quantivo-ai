"""
backend/run_demo.py — proof that main.py + store.py + orchestrator.py work
together through the real REST API, in-process (no network) via
httpx.ASGITransport, mirroring ml/run_demo.py's demo style.

Prerequisite: a reachable Redis (e.g. `docker run --rm -p 6379:6379
redis:7-alpine`), or set REDIS_URL to point elsewhere.

Run:
  # macOS/Linux
  PYTHONPATH=contracts:ml uv run python backend/run_demo.py
  # Windows
  PYTHONPATH="contracts;ml" uv run python backend/run_demo.py
"""
from __future__ import annotations

import asyncio

import httpx

from contracts import (
    AnalysisStatus, BusinessInput, BusinessStage, IndustryCategory, Location,
    PrimaryGoal, TargetCustomer,
)
from main import app, lifespan

_TERMINAL = {AnalysisStatus.COMPLETED.value, AnalysisStatus.PARTIAL.value,
             AnalysisStatus.FAILED.value}


async def main() -> None:
    inp = BusinessInput(
        business_type="Kedai kopi specialty",
        description="Kopi manual brew + ruang kerja",
        location=Location(city="Cikarang", district="Cikarang Selatan", province="Jawa Barat"),
        category=IndustryCategory.FOOD_BEVERAGE, radius_km=3,
        business_stage=BusinessStage.IDEA,
        primary_goals=[PrimaryGoal.VALIDATE_IDEA, PrimaryGoal.KNOW_COMPETITORS],
        target_customers=[TargetCustomer.OFFICE_WORKERS, TargetCustomer.STUDENTS],
    )

    async with lifespan(app):  # manually drive startup/shutdown — ASGITransport doesn't
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            r = await client.get("/health")
            print("HEALTH       :", r.json())

            r = await client.post("/api/analyses", json=inp.model_dump(mode="json"))
            r.raise_for_status()
            created = r.json()
            analysis_id = created["analysis_id"]
            print("CREATED      :", analysis_id)
            print("SCOPE SUMMARY:", created["scope"]["interpreted_summary"])

            r = await client.post(f"/api/analyses/{analysis_id}/confirm")
            r.raise_for_status()
            print("CONFIRMED    : status =", r.json()["status"])

            while True:
                r = await client.get(f"/api/analyses/{analysis_id}")
                r.raise_for_status()
                status_resp = r.json()
                print("POLL         :", status_resp["status"],
                      f"{status_resp['progress']['pct']}%")
                if status_resp["status"] in _TERMINAL:
                    break
                await asyncio.sleep(0.1)

            r = await client.get(f"/api/analyses/{analysis_id}/report")
            r.raise_for_status()
            report = r.json()
            print("=" * 68)
            print("STATUS       :", report["status"])
            print("EXEC SUMMARY :", report["executive_summary"])
            print("SENTIMENT    :",
                  report["sentiment"]["overall_distribution"] if report["sentiment"] else None)
            print("SWOT opps    :", report["swot"]["opportunities"] if report["swot"] else None)
            print("RECOMMENDS   :", report["recommendations"])
            print("DEGRADATION  :", report["degradation_notes"] or "(tidak ada)")
            print("=" * 68)


if __name__ == "__main__":
    asyncio.run(main())
