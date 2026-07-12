"""Test script for scraping modules using mock implementations.

Run: python -m scraping.test_scrapers
"""

import asyncio
import json
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from contracts import (
    BusinessInput, Location, IndustryCategory, BusinessStage,
    PrimaryGoal, TargetCustomer, ScopeConfig,
)
from scraping import MOCK_MODULES


def make_test_scope() -> ScopeConfig:
    """Create a test ScopeConfig for a coffee shop in Cikarang."""
    from datetime import datetime, timezone, timedelta

    def _now():
        return datetime.now(timezone.utc)

    inp = BusinessInput(
        business_type="Kedai kopi specialty",
        description="Kopi manual brew + ruang kerja, target mahasiswa & pekerja muda",
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
            PrimaryGoal.ASSESS_LOCATION,
        ],
        target_customers=[
            TargetCustomer.STUDENTS,
            TargetCustomer.OFFICE_WORKERS,
            TargetCustomer.YOUTH,
        ],
        budget_range="10m_50m",
    )

    return ScopeConfig(
        business_input=inp,
        interpreted_summary=(
            "Kami akan memvalidasi peluang Kedai kopi specialty dalam radius 3km "
            "dari Cikarang Selatan, dengan fokus: validate_idea, know_competitors, assess_location. "
            "Termasuk kompetitor lokal dan sentimen area sekitarnya."
        ),
        search_keywords=[
            "Kedai kopi specialty Cikarang",
            "Kedai kopi specialty mahasiswa",
            "Kedai kopi specialty pekerja muda",
        ],
        competitor_query="kedai kopi Cikarang",
        expires_at=_now() + timedelta(hours=48),
    )


async def test_module(module, scope: ScopeConfig) -> dict:
    """Test a single module and return results."""
    print(f"\n{'='*60}")
    print(f"Testing: {module.name}")
    print(f"{'='*60}")

    try:
        items = await module.fetch(scope)
        print(f"[OK] Success: {len(items)} items returned")

        # Show first item details
        if items:
            item = items[0]
            print(f"  First item:")
            print(f"    source_type: {item.source_type}")
            print(f"    source_name: {item.source_name}")
            print(f"    title: {item.title}")
            print(f"    raw_text (first 150): {item.raw_text[:150]}...")
            print(f"    lang_hint: {item.lang_hint}")
            print(f"    geo_hint: {item.geo_hint.city if item.geo_hint else 'None'}")

        return {"module": module.name, "count": len(items), "items": items, "error": None}

    except Exception as e:
        print(f"[ERR] Error: {e}")
        return {"module": module.name, "count": 0, "items": [], "error": str(e)}


async def main():
    """Run all mock scrapers against test scope."""
    scope = make_test_scope()
    print(f"Test scope: {scope.scope_id}")
    print(f"Business: {scope.business_input.business_type} @ {scope.business_input.location.city}")

    results = []
    for module in MOCK_MODULES:
        result = await test_module(module, scope)
        results.append(result)

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    total_items = 0
    for r in results:
        status = "[OK]" if r["error"] is None else "[ERR]"
        print(f"  {status} {r['module']:25s} : {r['count']:2d} items")
        total_items += r["count"]
    print(f"\nTotal items collected: {total_items}")

    # Save to file for inspection
    output = {
        "scope_id": scope.scope_id,
        "business_type": scope.business_input.business_type,
        "location": scope.business_input.location.city,
        "results": results,
    }
    out_path = Path(__file__).parent / "test_output.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2, default=str)
    print(f"\nFull output saved to: {out_path}")


if __name__ == "__main__":
    asyncio.run(main())