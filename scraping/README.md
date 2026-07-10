# Scraping Module - BOA SaaS

**Owner:** Faiz (Scraping Lead)  
**Status:** v1 Complete — Real API tested  
**Branch:** `feature/scraping-modules`

---

## Overview

This module implements the `ScraperModule` protocol from `contracts/interfaces.py`. It provides **6 data source modules** that collect `RawDataItem[]` for the analysis pipeline.

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
│   ├── databoks.py          # Databoks Market Data
│   └── brightdata.py        # BrightData TikTok Scraper
├── demo_kue_pancong.py      # E2E demo (scraper + router)
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

| Module | SourceType | API Key Required | Purpose | Real Tested |
|--------|-----------|-----------------|---------|-------------|
| `PlacesModule` | REVIEW, PLACES_LISTING | `GOOGLE_PLACES_API_KEY` | Competitors + customer reviews | — |
| `WebSearchModule` | NEWS, BLOG, ARTICLE | `TAVILY_API_KEY` or `BRAVE_SEARCH_API_KEY` | News, articles, blogs | ✅ |
| `TrendsModule` | TRENDS | `SERPAPI_API_KEY` | Keyword trend data | ✅ |
| `BpsModule` | BPS_STAT | `BPS_API_KEY` | Indonesian government statistics | — |
| `DataboksModule` | DATABOKS | `DATABOKS_API_KEY` | Curated market datasets | — |
| `BrightDataTiktokModule` | SOCIAL | `BRIGHTDATA_API_KEY` | TikTok posts by keyword | ✅ |

## ScraperRunner Features

1. **Parallel Execution** — All modules run concurrently via `asyncio.gather`
2. **Deduplication** — Removes duplicate items by:
   - Same `place_id` + `source_type` (for Places items)
   - Content hash (for other items)
3. **Circuit-Breaker** — Per-module timeout (180s) + error handling
4. **Health Reporting** — Tracks which modules are healthy/failed
5. **Degradation Notes** — Reports failures for `Report.degradation_notes`

## Real API Test Results (Kue Pancong Tapos Depok)

```
SCRAPER: 30 items (30 raw)

Module stats:
  [OK] tavily_web_search: 10 items
  [OK] google_trends: 5 items
  [OK] brightdata_tiktok: 15 items
  [FAIL] google_places: 0 items (no key)
  [FAIL] bps_statistics: 0 items (no key)
  [FAIL] databoks: 0 items (no key)

Source counts:
  social: 15 (TikTok)
  article: 10 (web)
  trends: 5 (Google Trends)
```

### TikTok Competitor Discovery (Real Data)

From 15 TikTok posts, identified competitors in Depok:
- **WarPan** (@warungpancong.id) — Pancoran Mas, viral, topping banyak
- **Pacong Balap** — GDC Depok
- **Pancong Lumer Amoca** — Depok, 2,447 likes
- **Warung Pancong Mang Kumis** — Jl. Komodo Raya, Beji, eksis sejak 1980-an

**Gap identified:** Belum ada kompetitor kue pancong di Kecamatan Tapos.

## Environment Variables

```bash
# Required for real modules
export GOOGLE_PLACES_API_KEY="..."
export TAVILY_API_KEY="..."
export BRAVE_SEARCH_API_KEY="..."
export SERPAPI_API_KEY="..."
export BPS_API_KEY="..."
export DATABOKS_API_KEY="..."
export BRIGHTDATA_API_KEY="..."
```

## E2E Demo

```bash
# Mock mode (offline, no keys needed)
PYTHONPATH=".;contracts;ml" uv run --no-sync python scraping/demo_kue_pancong.py

# Real mode (needs Tavily + SerpApi + BrightData keys)
$env:TAVILY_API_KEY="..."; $env:SERPAPI_API_KEY="..."; $env:BRIGHTDATA_API_KEY="..."
PYTHONPATH="." uv run --no-sync python scraping/_smoke_real_all.py
```

## Bugs Fixed

| Bug | Fix | File |
|-----|-----|------|
| BPS `_make_item` crashes on None value | Defensive check: None/non-numeric → "N/A" | `modules/bps.py:263-267` |
| `WebSearchModule.__init__` NameError | `tavily_key` → `tavily_api_key`, `brave_key` → `brave_api_key` | `modules/web_search.py:48-49` |
| Runner timeout too short for BrightData | Increased per-module timeout from 60s to 180s | `runner.py:132` |

## API Key Sources

| Service | Where to Get | Free Tier |
|---------|-------------|-----------|
| Google Places | [Google Cloud Console](https://console.cloud.google.com/) | $200/month credit |
| Tavily | [tavily.com](https://tavily.com/) | 1000 searches/month |
| Brave Search | [brave.com/search/api](https://brave.com/search/api/) | $5/month free credit |
| SerpApi | [serpapi.com](https://serpapi.com/) | 250 searches/month |
| BrightData | [brightdata.com](https://brightdata.com/) | 5K records/month |
| BPS | [webapi.bps.go.id](https://webapi.bps.go.id/) | Free with registration |
| Databoks | [databoks.katadata.co.id](https://databoks.katadata.co.id/) | Contact for API |

## Notes

- All modules are async and follow circuit-breaker pattern
- Mock modules produce realistic Indonesian market data
- Deduplication works by place_id (Places) or content hash (others)
- Health status is tracked per-module for degradation reporting
- BrightData TikTok uses async trigger → poll → parse pattern (longer timeout)
- Real scraper with Tavily + SerpApi + BrightData returns 30 items for "Kue Pancong Tapos Depok"
