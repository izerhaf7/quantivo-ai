"""Integration test for ScraperRunner with mock modules.

Tests the full pipeline: ScraperRunner -> Modules -> RawDataItem -> Dedup
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from contracts import (
    BusinessInput, Location, IndustryCategory, BusinessStage,
    PrimaryGoal, TargetCustomer, ScopeConfig,
)
from scraping.runner import ScraperRunner, create_runner


def make_test_scope() -> ScopeConfig:
    """Create a test ScopeConfig."""
    from datetime import datetime, timezone, timedelta

    def _now():
        return datetime.now(timezone.utc)

    inp = BusinessInput(
        business_type="Kedai kopi specialty",
        description="Kopi manual brew + ruang kerja",
        location=Location(
            city="Cikarang",
            district="Cikarang Selatan",
            province="Jawa Barat",
        ),
        category=IndustryCategory.FOOD_BEVERAGE,
        radius_km=3.0,
        business_stage=BusinessStage.IDEA,
        primary_goals=[
            PrimaryGoal.VALIDATE_IDEA,
            PrimaryGoal.KNOW_COMPETITORS,
        ],
        target_customers=[
            TargetCustomer.STUDENTS,
            TargetCustomer.OFFICE_WORKERS,
        ],
    )

    return ScopeConfig(
        business_input=inp,
        interpreted_summary="Test: Kedai kopi specialty di Cikarang",
        search_keywords=["kedai kopi Cikarang"],
        competitor_query="kedai kopi Cikarang",
        expires_at=_now() + timedelta(hours=48),
    )


async def test_runner_mock():
    """Test ScraperRunner with mock modules."""
    print("=" * 60)
    print("TEST: ScraperRunner with mock modules")
    print("=" * 60)

    runner = create_runner(use_mocks=True)
    scope = make_test_scope()

    print(f"Scope: {scope.scope_id}")
    print(f"Modules: {[m.name for m in runner.modules]}")
    print()

    result = await runner.run(scope)

    print(f"Total raw items: {result.total_raw}")
    print(f"After dedup: {result.total_deduped}")
    print(f"Degradation notes: {result.degradation_notes}")
    print()

    print("Module stats:")
    for name, stats in result.module_stats.items():
        status = "OK" if stats.healthy else "FAIL"
        print(f"  [{status}] {name}: {stats.items_count} items")
    print()

    print("Items by source_type:")
    from collections import Counter
    type_counts = Counter(item.source_type.value for item in result.items)
    for st, count in type_counts.most_common():
        print(f"  {st}: {count}")
    print()

    # Validate items
    print("Item validation:")
    for i, item in enumerate(result.items[:3]):
        print(f"  [{i+1}] {item.source_type.value} | {item.source_name} | {item.title[:50]}")
        assert item.item_id, "item_id missing"
        assert item.scope_id == scope.scope_id, "scope_id mismatch"
        assert item.raw_text, "raw_text empty"
    print()

    print("=" * 60)
    print("TEST PASSED")
    print("=" * 60)

    return result


async def test_runner_health_report():
    """Test health report functionality."""
    print("\n" + "=" * 60)
    print("TEST: Health report")
    print("=" * 60)

    runner = create_runner(use_mocks=True)
    health = runner.health_report()

    print("Health report:")
    for name, healthy in health.items():
        print(f"  {name}: {'healthy' if healthy else 'unhealthy'}")

    # All mocks should be healthy
    assert all(health.values()), "Some mock modules are unhealthy"

    print("\nTEST PASSED")


async def test_dedup():
    """Test deduplication logic."""
    print("\n" + "=" * 60)
    print("TEST: Deduplication")
    print("=" * 60)

    from contracts import RawDataItem, SourceType
    from scraping.runner import ScraperRunner

    runner = ScraperRunner(modules=[])

    # Create duplicate items (same place_id)
    item1 = RawDataItem(
        scope_id="test",
        source_type=SourceType.REVIEW,
        source_name="test",
        raw_text="Great coffee!",
        place_id="place_123",
    )
    item2 = RawDataItem(
        scope_id="test",
        source_type=SourceType.REVIEW,
        source_name="test",
        raw_text="Different text but same place",
        place_id="place_123",
    )
    item3 = RawDataItem(
        scope_id="test",
        source_type=SourceType.PLACES_LISTING,
        source_name="test",
        raw_text="Some listing",
        place_id="place_456",
    )

    deduped = runner._deduplicate([item1, item2, item3])
    print(f"Input: 3 items (2 same place_id, 1 different)")
    print(f"After dedup: {len(deduped)} items")

    # item1 and item2 have same place_id -> deduped to 1
    # item3 has different place_id -> kept
    assert len(deduped) == 2, f"Expected 2 items, got {len(deduped)}"

    print("TEST PASSED")


async def main():
    """Run all tests."""
    try:
        await test_runner_mock()
        await test_runner_health_report()
        await test_dedup()

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED")
        print("=" * 60)

    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())