# PROGRESS.md - Scraping Module

**Project:** BOA SaaS (Business Opportunity Analysis)  
**Event:** AMD Developer Hackathon: ACT II - Track Unicorn  
**Team:** 4 orang (Indra/Frontend, Razan/Backend, Izerhaf/AI-ML, Faiz/Scraping)

---

**Owner:** Faiz (Scraping Lead)  
**Last Updated:** 2026-07-10  
**Branch:** `faiz/scraping-v1`  
**Status:** v1 Complete — 9 modules, real API tested, .env integrated

---

## Summary

Scraping module v1 complete. **9 data source modules** + ScraperRunner orchestrator. API keys loaded automatically from `.env` file (no manual env vars needed). Real API tested with Tavily + SerpApi + BrightData — 30 items collected for "Kue Pancong di Kecamatan Tapos, Kota Depok".

---

## What Was Built

### 1. Scraper Modules (9 modules)

| # | Module | File | SourceType | Provider | Key |
|---|--------|------|-----------|----------|-----|
| 1 | PlacesModule | `modules/places.py` | REVIEW, PLACES_LISTING | Google Places | `GOOGLE_PLACES_API_KEY` |
| 2 | WebSearchModule | `modules/web_search.py` | NEWS, BLOG, ARTICLE | Tavily + Brave | `TAVILY_API_KEY` |
| 3 | TrendsModule | `modules/trends.py` | TRENDS | SerpApi | `SERPAPI_API_KEY` |
| 4 | BpsModule | `modules/bps.py` | BPS_STAT | BPS WebAPI | `BPS_API_KEY` |
| 5 | DataboksModule | `modules/databoks.py` | DATABOKS | Databoks API | `DATABOKS_API_KEY` |
| 6 | **BrightDataTiktokModule** | `modules/brightdata.py` | SOCIAL | BrightData | `BRIGHTDATA_API_KEY` |
| 7 | **FacebookSearchModule** | `modules/facebook_search.py` | FORUM | SocialAPIs | `SOCIALAPIS_API_KEY` |
| 8 | **InstagramModule** | `modules/instagram.py` | REVIEW | BrightData | `BRIGHTDATA_API_KEY` |
| 9 | **XModule** | `modules/x_twitter.py` | NEWS | BrightData | `BRIGHTDATA_API_KEY` |

### 2. .env Integration

**File:** `.env` (gitignored)  
**Loader:** `scraping/__init__.py` → `_load_dotenv()`

- Zero-dependency dotenv loader (no python-dotenv needed)
- Auto-loads `.env` from repo root on `import scraping`
- Env vars already set in shell take precedence over `.env`
- All 4 active keys loaded: Tavily, SerpApi, BrightData, SocialAPIs

### 3. ScraperRunner Orchestrator

**File:** `scraping/runner.py`

- Parallel execution via `asyncio.gather`
- Deduplication by place_id (Places) or content hash
- Circuit-breaker: 180s timeout per module
- Health reporting for degradation notes
- `create_runner(use_mocks=True/False)` factory

### 4. Bug Fixes

| Bug | Fix | File |
|-----|-----|------|
| BPS `_make_item` crashes on None value | Defensive check: None/non-numeric → "N/A" | `modules/bps.py:263-267` |
| `WebSearchModule.__init__` NameError | `tavily_key` → `tavily_api_key` | `modules/web_search.py:48-49` |
| Runner timeout too short for BrightData | 60s → 180s | `runner.py:132` |

### 5. Demo Script

**File:** `scraping/demo_kue_pancong.py`
- E2E demo: scraper (mocks) → router → print results

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
| WarPan (@warungpancong.id) | Pancoran Mas, Depok | TikTok viral |
| Pacong Balap | GDC Depok | TikTok review |
| Pancong Lumer Amoca | Depok | 2,447 likes |
| Warung Pancong Mang Kumis | Jl. Komodo Raya, Beji | Eksis sejak 1980-an |

**Gap identified:** Belum ada kompetitor kue pancong di Kecamatan Tapos.

---

## Commits (branch `faiz/scraping-v1`)

```
fd4f263 chore: add .env to gitignore
58ca81e feat(scraping): add Facebook, Instagram, X/Twitter modules
32a8d29 feat(scraping): add BrightData TikTok module, fix bugs, real API tested
0d0bb9a feat(scraping): add Kue pancong demo test script
bce703b fix(scraping): also accept numeric-string bps values, refresh evidence
d87e28d fix(scraping): defensive value formatting in bps.py _make_item
```

---

## Environment Setup

```bash
# .env file (gitignored, keys auto-loaded on import)
TAVILY_API_KEY=tvly-dev-...
SERPAPI_API_KEY=aa48f5f...
BRIGHTDATA_API_KEY=17b06a3f-...
SOCIALAPIS_API_KEY=2cac26b...
GOOGLE_PLACES_API_KEY=        # optional
BRAVE_SEARCH_API_KEY=         # optional
BPS_API_KEY=                  # optional
DATABOKS_API_KEY=             # optional
```

---

## Next Steps

1. **Google Places** — kompetitor physical locations di Tapos
2. **BPS** — statistik pengeluaran makanan Depok
3. **Integrate with orchestrator** (Razan)
4. **Docker setup** untuk submission

---

*Document updated: 2026-07-10*  
*Project: BOA SaaS - AMD Developer Hackathon ACT II Track Unicorn*
