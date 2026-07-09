"""Scraping modules package - implementations of ScraperModule protocol.

Each module corresponds to a SourceType:
- places.py -> REVIEW, PLACES_LISTING
- web_search.py -> NEWS, BLOG, ARTICLE
- trends.py -> TRENDS
- bps.py -> BPS_STAT
- databoks.py -> DATABOKS

All modules implement the ScraperModule protocol:
    async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]
    def is_healthy(self) -> bool

Circuit-breaker pattern: on failure/limit, return [] + log, DON'T raise.
"""

from .places import PlacesModule, MockPlacesModule
from .web_search import WebSearchModule, MockWebSearchModule
from .trends import TrendsModule, MockTrendsModule
from .bps import BpsModule, MockBpsModule
from .databoks import DataboksModule, MockDataboksModule

__all__ = [
    # Real implementations
    "PlacesModule",
    "WebSearchModule",
    "TrendsModule",
    "BpsModule",
    "DataboksModule",
    # Mock implementations (for testing without API keys)
    "MockPlacesModule",
    "MockWebSearchModule",
    "MockTrendsModule",
    "MockBpsModule",
    "MockDataboksModule",
]