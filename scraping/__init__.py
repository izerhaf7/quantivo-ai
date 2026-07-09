"""Scraping package - Faiz's domain (Scraping Owner).

Implements ScraperModule protocol per contracts/interfaces.py.

Quick Start:
    from scraping import create_runner

    # Mock mode (no API keys, for testing)
    runner = create_runner(use_mocks=True)
    result = await runner.run(scope)

    # Real mode (needs API keys in env)
    runner = create_runner(use_mocks=False)
    result = await runner.run(scope)

    # result.items = list[RawDataItem]
    # result.degradation_notes = list[str] (which modules failed)

Modules:
    - PlacesModule: Google Places API (competitors + reviews)
    - WebSearchModule: Tavily + Brave (news/blogs/articles)
    - TrendsModule: SerpApi Google Trends (keyword trends)
    - BpsModule: BPS WebAPI (Indonesian statistics)
    - DataboksModule: Databoks API (curated market datasets)

All modules:
    - Implement contracts.interfaces.ScraperModule protocol
    - Return RawDataItem[] as per contracts.py
    - Circuit-breaker: return [] on failure, never raise
    - Mock implementations available for testing without API keys
"""

from .modules import (
    PlacesModule,
    WebSearchModule,
    TrendsModule,
    BpsModule,
    DataboksModule,
    MockPlacesModule,
    MockWebSearchModule,
    MockTrendsModule,
    MockBpsModule,
    MockDataboksModule,
)
from .runner import ScraperRunner, ScraperResult, ModuleStats, create_runner

__all__ = [
    # ScraperRunner (main entry point)
    "ScraperRunner",
    "ScraperResult",
    "ModuleStats",
    "create_runner",
    # Real modules
    "PlacesModule",
    "WebSearchModule",
    "TrendsModule",
    "BpsModule",
    "DataboksModule",
    # Mock modules
    "MockPlacesModule",
    "MockWebSearchModule",
    "MockTrendsModule",
    "MockBpsModule",
    "MockDataboksModule",
]

# Convenience: all mock modules for quick testing
MOCK_MODULES = [
    MockPlacesModule(),
    MockWebSearchModule(),
    MockTrendsModule(),
    MockBpsModule(),
    MockDataboksModule(),
]

# Real modules (need API keys)
REAL_MODULES = [
    PlacesModule,
    WebSearchModule,
    TrendsModule,
    BpsModule,
    DataboksModule,
]