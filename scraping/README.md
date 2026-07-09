# Scraping Module - BOA SaaS

**Owner:** Faiz (Scraping Lead)  
**Status:** Implementation Complete  
**Branch:** `feature/scraping-modules`

---

## Overview

This module implements the `ScraperModule` protocol from `contracts/interfaces.py`. It provides 5 data source modules that collect `RawDataItem[]` for the analysis pipeline.

## Architecture

```
scraping/
├── __init__.py              # Package exports
├── runner.py                # ScraperRunner orchestrator
├── modules/
│   ├── __init__.py
│   ├── places.py            # Google Places API
│   ├── web_search.py        # Tavily + Brave Search
│   ├── trends.py            # Google Trends (SerpApi)
│   ├── bps.py               # BPS Statistics
│   └── databoks.py          # Databoks Market Data
├── test_scrapers.py         # Module unit tests
└── test_runner.py           # Integration tests
```

## Quick Start

```python
from scraping import create_runner

# Mock mode (no API keys, for testing)
runner = create_runner(use_mocks=True)
result = await runner.run(scope)

# Real mode (needs API keys in env)
runner = create_runner(use_mocks=False)
result = await runner.run(scope)

# Result
print(f"Items: {len(result.items)}")
print(f"Degradation: {result.degradation_notes}")
```

## Modules

| Module | SourceType | API Key Required | Purpose |
|--------|-----------|-----------------|---------|
| `PlacesModule` | REVIEW, PLACES_LISTING | `GOOGLE_PLACES_API_KEY` | Competitors + customer reviews |
| `WebSearchModule` | NEWS, BLOG, ARTICLE | `TAVILY_API_KEY` or `BRAVE_SEARCH_API_KEY` | News, articles, blogs |
| `TrendsModule` | TRENDS | `SERPAPI_API_KEY` | Keyword trend data |
| `BpsModule` | BPS_STAT | `BPS_API_KEY` | Indonesian government statistics |
| `DataboksModule` | DATABOKS | `DATABOKS_API_KEY` | Curated market datasets |

## ScraperRunner Features

1. **Parallel Execution** - All modules run concurrently via `asyncio.gather`
2. **Deduplication** - Removes duplicate items by:
   - Same `place_id` + `source_type` (for Places items)
   - Content hash (for other items)
3. **Circuit-Breaker** - Per-module timeout (60s) + error handling
4. **Health Reporting** - Tracks which modules are healthy/failed
5. **Degradation Notes** - Reports failures for `Report.degradation_notes`

## Circuit-Breaker Pattern

All modules follow the contract rule:
```python
# On failure/limit: return [] + log, DON'T raise
async def fetch(self, scope: ScopeConfig) -> list[RawDataItem]:
    try:
        # ... API calls ...
        return items
    except Exception as e:
        logger.warning("Module failed: %s", e)
        self._healthy = False
        return []  # Graceful degradation
```

## Test Results

```
[OK] google_places_mock        :  4 items
[OK] tavily_web_search_mock    :  3 items
[OK] google_trends_mock        :  2 items
[OK] bps_statistics_mock       :  2 items
[OK] databoks_mock             :  2 items
Total items collected: 13
After dedup: 13
```

## Environment Variables

```bash
# Required for real modules
export GOOGLE_PLACES_API_KEY="..."
export TAVILY_API_KEY="..."
export BRAVE_SEARCH_API_KEY="..."
export SERPAPI_API_KEY="..."
export BPS_API_KEY="..."
export DATABOKS_API_KEY="..."
```

## Integration with Orchestrator (Razan)

```python
# In backend/orchestrator.py
from scraping import create_runner

async def run_pipeline(scope: ScopeConfig) -> Report:
    # 1. Scrape
    runner = create_runner(use_mocks=False)
    result = await runner.run(scope)
    
    # 2. Route (Izerhaf)
    routed = await router.route(result.items, scope, config)
    
    # 3. Process (Izerhaf)
    # ...
    
    # 4. Report with degradation notes
    report = Report(
        scope_id=scope.scope_id,
        status=AnalysisStatus.COMPLETED,
        degradation_notes=result.degradation_notes,
        # ...
    )
    return report
```

## API Key Sources

| Service | Where to Get | Free Tier |
|---------|-------------|-----------|
| Google Places | [Google Cloud Console](https://console.cloud.google.com/) | $200/month credit |
| Tavily | [tavily.com](https://tavily.com/) | 1000 searches/month |
| Brave Search | [brave.com/search/api](https://brave.com/search/api/) | 2000 queries/month |
| SerpApi | [serpapi.com](https://serpapi.com/) | 100 searches/month |
| BPS | [webapi.bps.go.id](https://webapi.bps.go.id/) | Free with registration |
| Databoks | [databoks.katadata.co.id](https://databoks.katadata.co.id/) | Contact for API |

## Next Steps

1. **Get API keys** for production modules
2. **Test with real APIs** (replace mocks)
3. **Integrate with orchestrator** (Razan)
4. **Add more sources** if needed (Instagram, TikTok - future)
5. **Monitor API quotas** during hackathon

## Notes

- All modules are async and follow circuit-breaker pattern
- Mock modules produce realistic Indonesian market data
- Deduplication works by place_id (Places) or content hash (others)
- Health status is tracked per-module for degradation reporting
- Timeout per module is 60 seconds (configurable)
