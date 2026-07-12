# Task: Pre-PR Playwright E2E QA

Goal: before any PR, verify Google OAuth + SQLite auth work does not break core product flow, frontend design, or UX effectiveness.

Hard rules:
- Do not read or print `.env`, `.env.*`, or `/home/anomalindra/Downloads/client_secret_*.json`.
- Use Playwright MCP/browser testing for visual + interaction QA.
- Capture screenshots or written evidence for important states.
- If bugs found, fix them, then rerun relevant checks.
- Do not push or create PR until QA passes or user accepts known blockers.

Scope:
1. Static verification
   - `uv run python -m compileall backend contracts ml scraping`
   - `npm run build`
2. Backend smoke
   - start backend locally if possible
   - `GET /health`
   - `HEAD/GET /auth/google/start` should redirect to Google without exposing secrets
   - `/auth/me` returns 401 when unauthenticated
3. Frontend E2E via Playwright
   - start frontend dev server
   - login page loads cleanly
   - Google login button visible/enabled
   - Google OAuth full callback is production-domain only: `https://consultin.alleysa.web.id/auth/google/callback`
   - Local QA should only smoke `/auth/google/start` redirect target and use normal register/email fallback for in-app flow testing.
   - Facebook login removed
   - phone OTP register/verify path removed
   - no dead disabled auth buttons
   - email/password fallback does not trap user or show broken affordances
   - logout path works if session can be mocked or reached
4. Core product flow after auth gate
   - dashboard visible after allowed login/dev bypass/session mock
   - incomplete query: no preview while typing
   - click `Susun brief`: preview + `Lengkapi informasi`
   - fill clarification: processing skeleton appears
   - report renders or backend blocker documented
   - history/account pages do not crash
5. UI/UX effectiveness QA
   - visual hierarchy clear on mobile and desktop
   - Google auth placement obvious
   - removed features leave no awkward empty gaps
   - dark/light contrast acceptable
   - keyboard Tab order usable on login and dashboard
   - no console errors after navigation/interactions
   - no AI-slop regression: generic dashboard polish, random purple glow, inconsistent buttons, broken spacing

Deliverable:
- Write report to `qa/playwright-e2e-report.md` with:
  - commands run
  - pass/fail table
  - screenshots paths if available
  - bugs found and fixes made
  - remaining blockers

Suggested commands:
```bash
npm run build
uv run python -m compileall backend contracts ml scraping
npm run dev
uv run uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Use Playwright MCP if available. If MCP unavailable, use `npx playwright` or browser devtools MCP. Install only if needed and ask/record why.
