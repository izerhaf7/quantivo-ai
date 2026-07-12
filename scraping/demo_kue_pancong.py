# ─── How to run ───
# PowerShell (repo root):
#   $env:PYTHONPATH = ".;contracts;ml"; uv run --no-sync python scraping/demo_kue_pancong.py
from __future__ import annotations

import asyncio  # noqa: ANYIO_OK
import sys
from collections import Counter
from datetime import timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from contracts import (  # noqa: E402
    AnalysisTrack,
    BusinessInput,
    BusinessStage,
    IndustryCategory,
    Location,
    PrimaryGoal,
    RouterConfig,
    ScopeConfig,
    TargetCustomer,
)
import contracts as contracts_package  # noqa: E402
from contracts.contracts import _now  # noqa: E402
from scraping.runner import create_runner  # noqa: E402

setattr(contracts_package, "_now", _now)  # router.py imports this private contract helper.


def make_scope() -> ScopeConfig:
    return ScopeConfig(
        business_input=BusinessInput(
            business_type="Kedai kue pancong",
            description="Kue pancong tradisional Betawi",
            location=Location(city="Depok", district=None, province="Jawa Barat"),
            category=IndustryCategory.FOOD_BEVERAGE,
            radius_km=3.0,
            business_stage=BusinessStage.NEW,
            primary_goals=[PrimaryGoal.KNOW_COMPETITORS, PrimaryGoal.MEASURE_DEMAND],
            target_customers=[TargetCustomer.GENERAL],
        ),
        interpreted_summary="Analisis kedai kue pancong tradisional Betawi di Kota Depok radius 3 km.",
        search_keywords=["kue pancong Depok", "kedai kue pancong Depok"],
        competitor_query="kedai kue pancong Depok",
        expires_at=_now() + timedelta(hours=48),
    )


async def main() -> None:
    scope = make_scope()
    runner = create_runner(use_mocks=True)
    result = await runner.run(scope)

    print(f"Total raw items: {result.total_raw}")
    print(f"Total deduped items: {result.total_deduped}")
    print("Source type counts:")
    for source_type, count in Counter(item.source_type.value for item in result.items).most_common():
        print(f"  {source_type}: {count}")

    print("Module stats:")
    for name, stats in result.module_stats.items():
        status = "OK" if stats.healthy else "FAIL"
        print(f"  [{status}] {name}: {stats.items_count} items")

    print("Degradation notes:")
    for note in result.degradation_notes:
        print(f"  - {note}")
    if not result.degradation_notes:
        print("  - none")
    print("SCRAPER OK")

    try:
        from ml.embeddings import MockEmbeddingClient
        from ml.router import DataRouter
    except ImportError as exc:
        print(f"ROUTER IMPORT ERROR: {exc}")
        print("Fix: run from repo root with PowerShell command:")
        print('  $env:PYTHONPATH = ".;contracts;ml"; uv run --no-sync python scraping/demo_kue_pancong.py')
        raise SystemExit(1) from exc

    routed = await DataRouter(MockEmbeddingClient()).route(result.items, scope, RouterConfig())
    kept_count = sum(1 for item in routed if item.decision.kept)
    discarded_count = len(routed) - kept_count
    track_counts = Counter(
        track.value
        for item in routed
        for track in item.decision.tracks
        if track is not AnalysisTrack.DISCARD
    )

    print(f"Routing kept: {kept_count}")
    print(f"Routing discarded: {discarded_count}")
    print("Route track counts:")
    for track, count in track_counts.most_common():
        print(f"  {track}: {count}")
    if not track_counts:
        print("  none: 0")
    print("ROUTER OK")


if __name__ == "__main__":
    asyncio.run(main())
