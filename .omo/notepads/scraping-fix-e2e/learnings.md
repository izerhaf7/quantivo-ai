
## Demo script: scraping/demo_kue_pancong.py

Runs the full pipeline end-to-end with mocks for the "Kue pancong di Kota Depok" scope.

### Windows (PowerShell) — run from repo root

``powershell
  $env:PYTHONPATH = ".;contracts;ml"; uv run --no-sync python scraping/demo_kue_pancong.py
``

(; is the PATH separator on Windows; . puts the repo root on path so contracts and ml resolve as packages.)

### macOS/Linux (bash)

``bash
PYTHONPATH=.;contracts;ml uv run --no-sync python scraping/demo_kue_pancong.py
``

### Expected output markers

- SCRAPER OK — emitted after the scraper phase summary.
- ROUTER OK — emitted after DataRouter produces routed decisions.

### Notes from development

- Mock scrapers emit 13 items across 5 modules.
- The script does not assert hard keep-rates: the router's mock embedding is lexical
  (trigram hash), so it may discard many kue-pancong items whose text shares few
  trigrams with the "Kue pancong tradisional Betawi" intent. Both phase markers
  must always print.


## commit message

eat(scraping): add Kue pancong demo test script

