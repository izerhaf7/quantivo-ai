"""Scraping package - Faiz's domain (Scraping Owner).

Implements ScraperModule protocol per contracts/interfaces.py.

Usage:
    from scraping import PlacesModule, WebSearchModule, MockPlacesModule

    # Real (needs API keys)
    places = PlacesModule()
    web = WebSearchModule()
    items = await places.fetch(scope)

    # Mock (for testing without keys)
    mock_places = MockPlacesModule()
    items = await mock_places.fetch(scope)

All modules are async, circuit-breaker safe (return [] on failure).
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

__all__ = [
    "PlacesModule",
    "WebSearchModule",
    "TrendsModule",
    "BpsModule",
    "DataboksModule",
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