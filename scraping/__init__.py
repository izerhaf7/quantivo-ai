"""Scraping package - Faiz's domain (Scraping Owner).

Implements ScraperModule protocol per contracts/interfaces.py.

Quick Start:
    from scraping import create_runner

    # Mock mode (no API keys, for testing)
    runner = create_runner(use_mocks=True)
    result = await runner.run(scope)

    # Real mode (needs API keys in .env or env vars)
    runner = create_runner(use_mocks=False)
    result = await runner.run(scope)

    # result.items = list[RawDataItem]
    # result.degradation_notes: list[str] (which modules failed)

Modules (9 total):
    - PlacesModule: Google Places API (competitors + reviews)
    - WebSearchModule: Tavily + Brave (news/blogs/articles)
    - TrendsModule: SerpApi Google Trends (keyword trends)
    - BpsModule: BPS WebAPI (Indonesian statistics)
    - DataboksModule: Databoks API (curated market datasets)
    - BrightDataTiktokModule: TikTok posts (BrightData)
    - FacebookSearchModule: Facebook posts (SocialAPIs)
    - InstagramModule: Instagram profiles/posts (BrightData)
    - XModule: X/Twitter posts (BrightData)

All modules:
    - Implement contracts.interfaces.ScraperModule protocol
    - Return RawDataItem[] as per contracts.py
    - Circuit-breaker: return [] on failure, never raise
    - Mock implementations available for testing without API keys
    - API keys loaded from .env file automatically
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)


def _load_dotenv() -> None:
    """Load .env file from repo root into os.environ (no python-dotenv needed).

    Skips keys that are already set in the environment (env vars take precedence).
    There is exactly ONE .env for the whole project, at the repo root -- shared
    with ml/ (see ml/llm_demo.py). A .env placed anywhere else, e.g. scraping/.env,
    is never read by this loader; warn loudly so a locally-set key doesn't
    silently go unused.
    """
    stray_env = Path(__file__).resolve().parent / ".env"
    if stray_env.is_file():
        logger.warning(
            "%s exists but is IGNORED -- only the repo-root .env is loaded. "
            "Move its contents to the root .env instead.",
            stray_env,
        )

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.is_file():
        return

    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


_load_dotenv()


from .modules import (
    PlacesModule,
    WebSearchModule,
    TrendsModule,
    BpsModule,
    DataboksModule,
    BrightDataTiktokModule,
    FacebookSearchModule,
    InstagramModule,
    XModule,
    MockPlacesModule,
    MockWebSearchModule,
    MockTrendsModule,
    MockBpsModule,
    MockDataboksModule,
    MockTiktokModule,
    MockFacebookSearchModule,
    MockInstagramModule,
    MockXModule,
)
from .runner import ScraperRunner, ScraperResult, ModuleStats, create_runner

__all__ = [
    "ScraperRunner",
    "ScraperResult",
    "ModuleStats",
    "create_runner",
    "PlacesModule",
    "WebSearchModule",
    "TrendsModule",
    "BpsModule",
    "DataboksModule",
    "BrightDataTiktokModule",
    "FacebookSearchModule",
    "InstagramModule",
    "XModule",
    "MockPlacesModule",
    "MockWebSearchModule",
    "MockTrendsModule",
    "MockBpsModule",
    "MockDataboksModule",
    "MockTiktokModule",
    "MockFacebookSearchModule",
    "MockInstagramModule",
    "MockXModule",
]

MOCK_MODULES = [
    MockPlacesModule(),
    MockWebSearchModule(),
    MockTrendsModule(),
    MockBpsModule(),
    MockDataboksModule(),
    MockTiktokModule(),
    MockFacebookSearchModule(),
    MockInstagramModule(),
    MockXModule(),
]

REAL_MODULES = [
    PlacesModule,
    WebSearchModule,
    TrendsModule,
    BpsModule,
    DataboksModule,
    BrightDataTiktokModule,
    FacebookSearchModule,
    InstagramModule,
    XModule,
]