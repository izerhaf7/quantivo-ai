# PROGRESS.md - Scraping Module

**Project:** BOA SaaS (Business Opportunity Analysis)  
**Event:** AMD Developer Hackathon: ACT II - Track Unicorn  
**Team:** 4 orang (Indra/Frontend, Razan/Backend, Izerhaf/AI-ML, Faiz/Scraping)

---

**Owner:** Faiz (Scraping Lead)  
**Last Updated:** 2026-07-10  
**Branch:** `feature/scraping-modules`  
**Status:** v1 Complete — Real API tested, 6 modules

---

## Summary

Scraping module v1 complete. **6 data source modules** + ScraperRunner orchestrator. Real API tested with Tavily + SerpApi + BrightData — 30 items collected for "Kue Pancong di Kecamatan Tapos, Kota Depok". TikTok competitor discovery identifies 4+ competitors in Depok, zero in Tapos.

---

## What Was Built

### 1. Scraper Modules (6 modules)

| Module | File | SourceType | API Key | Real Tested |
|--------|------|-----------|---------|-------------|
| PlacesModule | `modules/places.py` | REVIEW, PLACES_LISTING | `GOOGLE_PLACES_API_KEY` | — |
| WebSearchModule | `modules/web_search.py` | NEWS, BLOG, ARTICLE | `TAVILY_API_KEY` / `BRAVE_SEARCH_API_KEY` | ✅ |
| TrendsModule | `modules/trends.py` | TRENDS | `SERPAPI_API_KEY` | ✅ |
| BpsModule | `modules/bps.py` | BPS_STAT | `BPS_API_KEY` | — |
| DataboksModule | `modules/databoks.py` | DATABOKS | `DATABOKS_API_KEY` | — |
| **BrightDataTiktokModule** | `modules/brightdata.py` | SOCIAL | `BRIGHTDATA_API_KEY` | ✅ |

### 2. ScraperRunner Orchestrator

**File:** `scraping/runner.py`

- Parallel execution via `asyncio.gather`
- Deduplication by place_id (Places) or content hash
- Circuit-breaker: 180s timeout per module (increased for BrightData async)
- Health reporting for degradation notes
- `create_runner(use_mocks=True/False)` factory

### 3. Bug Fixes

| Bug | Fix | File |
|-----|-----|------|
| BPS `_make_item` crashes on None value | Defensive check: None/non-numeric → "N/A" | `modules/bps.py:263-267` |
| `WebSearchModule.__init__` NameError | `tavily_key` → `tavily_api_key`, `brave_key` → `brave_api_key` | `modules/web_search.py:48-49` |
| Runner timeout too short for BrightData | Increased per-module timeout from 60s to 180s | `runner.py:132` |

### 4. Demo Script

**File:** `scraping/demo_kue_pancong.py`
- E2E demo: scraper (mocks) → router → print results
- Tests full pipeline with "Kue Pancong Tapos Depok" scope

---

## Real API Test Results

### Kue Pancong di Kecamatan Tapos, Kota Depok

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

| Competitor | Location | Evidence |
|------------|----------|----------|
| WarPan (@warungpancong.id) | Pancoran Mas, Depok | TikTok viral, topping banyak |
| Pacong Balap | GDC Depok | TikTok review |
| Pancong Lumer Amoca | Depok | 2,447 likes TikTok |
| Warung Pancong Mang Kumis | Jl. Komodo Raya, Beji | Eksis sejak 1980-an |

**Gap identified:** Belum ada kompetitor kue pancong di Kecamatan Tapos.

### Google Trends

- "Kue pancong": tren **naik +13.8%**
- "cafe": tren naik +11.4%
- "kopi": tren turun -8.1%

---

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `scraping/modules/brightdata.py` | **New** | BrightData TikTok Scraper |
| `scraping/modules/web_search.py` | Fixed | NameError in __init__ |
| `scraping/modules/bps.py` | Fixed | Defensive value formatting |
| `scraping/modules/__init__.py` | Modified | Added BrightDataTiktokModule export |
| `scraping/runner.py` | Modified | Added BrightData wiring + timeout increase |
| `scraping/demo_kue_pancong.py` | **New** | E2E demo script |
| `scraping/README.md` | Modified | Updated with 6 modules + real test results |
| `PROGRESS.md` | Modified | Updated with v1 status |

---

## Dependencies

- `tenacity>=9.1.4` (retry/circuit-breaker for API calls)
- `httpx` (async HTTP client, already in pyproject.toml)

---

## Environment Variables

```bash
export GOOGLE_PLACES_API_KEY="..."
export TAVILY_API_KEY="..."
export BRAVE_SEARCH_API_KEY="..."
export SERPAPI_API_KEY="..."
export BPS_API_KEY="..."
export DATABOKS_API_KEY="..."
export BRIGHTDATA_API_KEY="..."
```

---

## Next Steps

1. **Google Places** — untuk kompetitor physical locations di Tapos
2. **BPS** — statistik pengeluaran makanan Depok
3. **SocialAPIs Facebook** — social listening via Facebook posts
4. **Integrate with orchestrator** (Razan)
5. **Docker setup** untuk submission

---

*Document updated: 2026-07-10*  
*Project: BOA SaaS - AMD Developer Hackathon ACT II Track Unicorn*
