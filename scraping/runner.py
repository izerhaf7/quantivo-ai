"""ScraperRunner - orchestrates all ScraperModule instances.

Runs modules in parallel, deduplicates results, and reports health status.
This is the main entry point that the backend orchestrator (Razan) calls.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from dataclasses import dataclass, field
from typing import Protocol

from contracts import RawDataItem, ScopeConfig
from contracts.interfaces import ScraperModule

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class ScraperResult:
    """Result of a full scraping run."""
    items: list[RawDataItem]
    total_raw: int
    total_deduped: int
    module_stats: dict[str, ModuleStats]
    degradation_notes: list[str]


@dataclass(frozen=True, slots=True)
class ModuleStats:
    """Stats for a single module."""
    name: str
    healthy: bool
    items_count: int
    error: str | None = None


class ScraperRunner:
    """Orchestrates multiple ScraperModules.

    Runs all modules in parallel, deduplicates by content hash,
    and provides health reporting for degradation notes.

    Usage:
        runner = ScraperRunner(modules=[PlacesModule(), WebSearchModule(), ...])
        result = await runner.run(scope)
        # result.items = deduplicated list of RawDataItem
        # result.degradation_notes = list of failed modules
    """

    def __init__(
        self,
        modules: list[ScraperModule],
        max_concurrent: int = 5,
        dedup_threshold: float = 0.95,
    ):
        self.modules = modules
        self.max_concurrent = max_concurrent
        self.dedup_threshold = dedup_threshold

    async def run(self, scope: ScopeConfig) -> ScraperResult:
        """Run all scraper modules and aggregate results.

        Args:
            scope: The ScopeConfig defining what to scrape.

        Returns:
            ScraperResult with deduplicated items and health stats.
        """
        logger.info("ScraperRunner: starting run for scope %s", scope.scope_id)

        # Run all modules in parallel with concurrency limit
        semaphore = asyncio.Semaphore(self.max_concurrent)
        tasks = [
            self._run_module(module, scope, semaphore)
            for module in self.modules
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Aggregate results
        all_items: list[RawDataItem] = []
        module_stats: dict[str, ModuleStats] = {}
        degradation_notes: list[str] = []

        for result in results:
            if isinstance(result, Exception):
                # Shouldn't happen since _run_module catches exceptions
                logger.error("ScraperRunner: unexpected exception: %s", result)
                degradation_notes.append(f"Unexpected error: {result}")
                continue

            stats, items, note = result
            module_stats[stats.name] = stats
            all_items.extend(items)

            if note:
                degradation_notes.append(note)

        total_raw = len(all_items)

        # Deduplicate
        deduped = self._deduplicate(all_items)
        total_deduped = len(deduped)

        logger.info(
            "ScraperRunner: collected %d raw items, %d after dedup from %d modules",
            total_raw,
            total_deduped,
            len(self.modules),
        )

        return ScraperResult(
            items=deduped,
            total_raw=total_raw,
            total_deduped=total_deduped,
            module_stats=module_stats,
            degradation_notes=degradation_notes,
        )

    async def _run_module(
        self,
        module: ScraperModule,
        scope: ScopeConfig,
        semaphore: asyncio.Semaphore,
    ) -> tuple[ModuleStats, list[RawDataItem], str | None]:
        """Run a single module with circuit-breaker and timeout."""
        async with semaphore:
            try:
                # Add timeout per module (30s default)
                items = await asyncio.wait_for(
                    module.fetch(scope),
                    timeout=180.0,
                )

                healthy = module.is_healthy()
                note = None
                if not healthy:
                    note = f"{module.name}: marked unhealthy after run"
                    logger.warning("ScraperRunner: %s", note)

                return (
                    ModuleStats(
                        name=module.name,
                        healthy=healthy,
                        items_count=len(items),
                    ),
                    items,
                    note,
                )

            except asyncio.TimeoutError:
                note = f"{module.name}: timeout after 60s"
                logger.warning("ScraperRunner: %s", note)
                return (
                    ModuleStats(
                        name=module.name,
                        healthy=False,
                        items_count=0,
                        error="timeout",
                    ),
                    [],
                    note,
                )

            except Exception as e:  # noqa: BLE001
                note = f"{module.name}: {type(e).__name__}: {e}"
                logger.error("ScraperRunner: %s", note)
                return (
                    ModuleStats(
                        name=module.name,
                        healthy=False,
                        items_count=0,
                        error=str(e),
                    ),
                    [],
                    note,
                )

    def _deduplicate(self, items: list[RawDataItem]) -> list[RawDataItem]:
        """Remove duplicate items by content hash.

        Dedup strategy:
        1. Same place_id + source_type = duplicate (same place, same source)
        2. Same content hash (normalized text) = duplicate
        """
        seen_hashes: set[str] = set()
        deduped: list[RawDataItem] = []

        for item in items:
            # Generate content hash
            content_hash = self._content_hash(item)

            if content_hash in seen_hashes:
                logger.debug("ScraperRunner: dedup item %s (hash %s)", item.item_id, content_hash[:8])
                continue

            seen_hashes.add(content_hash)
            deduped.append(item)

        return deduped

    @staticmethod
    def _content_hash(item: RawDataItem) -> str:
        """Generate a content hash for deduplication.

        Uses place_id + source_type for Places items (same place = duplicate).
        Uses normalized text hash for other items.
        """
        # For Places items, use place_id as primary dedup key
        if item.place_id:
            key = f"{item.place_id}:{item.source_type.value}"
            return hashlib.sha256(key.encode()).hexdigest()

        # For other items, use normalized text
        normalized = item.raw_text.lower().strip()
        normalized = " ".join(normalized.split())  # collapse whitespace
        return hashlib.sha256(normalized.encode()).hexdigest()

    def health_report(self) -> dict[str, bool]:
        """Return health status of all modules."""
        return {module.name: module.is_healthy() for module in self.modules}


# ---- Convenience factory ----

def create_runner(
    use_mocks: bool = False,
    api_keys: dict[str, str] | None = None,
) -> ScraperRunner:
    """Create a ScraperRunner with all modules.

    Args:
        use_mocks: If True, use mock modules (no API keys needed).
        api_keys: Dict of API key env vars (only used if use_mocks=False).

    Returns:
        Configured ScraperRunner instance.
    """
    if use_mocks:
        from .modules import (
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
        return ScraperRunner(modules=[
            MockPlacesModule(),
            MockWebSearchModule(),
            MockTrendsModule(),
            MockBpsModule(),
            MockDataboksModule(),
            MockTiktokModule(),
            MockFacebookSearchModule(),
            MockInstagramModule(),
            MockXModule(),
        ])

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
    )

    modules = []

    # Only add modules that have API keys configured
    if api_keys:
        if api_keys.get("google_places"):
            modules.append(PlacesModule(api_key=api_keys["google_places"]))
        if api_keys.get("tavily"):
            modules.append(WebSearchModule(tavily_api_key=api_keys["tavily"]))
        if api_keys.get("brave"):
            modules.append(WebSearchModule(brave_api_key=api_keys["brave"]))
        if api_keys.get("serpapi"):
            modules.append(TrendsModule(serpapi_key=api_keys["serpapi"]))
        if api_keys.get("bps"):
            modules.append(BpsModule(api_key=api_keys["bps"]))
        if api_keys.get("databoks"):
            modules.append(DataboksModule(api_key=api_keys["databoks"]))
        if api_keys.get("brightdata"):
            modules.append(BrightDataTiktokModule(api_key=api_keys["brightdata"]))
            modules.append(InstagramModule(api_key=api_keys["brightdata"]))
            modules.append(XModule(api_key=api_keys["brightdata"]))
        if api_keys.get("socialapis"):
            modules.append(FacebookSearchModule(api_key=api_keys["socialapis"]))
    else:
        # Try to use env vars — modules degrade gracefully if key is missing
        modules = [
            PlacesModule(),
            WebSearchModule(),
            TrendsModule(),
            BpsModule(),
            DataboksModule(),
            BrightDataTiktokModule(),
            FacebookSearchModule(),
            InstagramModule(),
            XModule(),
        ]

    return ScraperRunner(modules=modules)