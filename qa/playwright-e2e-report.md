# Playwright E2E QA Report

Status: PASS with documented local-service limits.

## Commands run

| Command | Result |
|---|---:|
| `PYTHONPATH=backend:contracts:ml uv run python -m compileall backend contracts ml scraping` | PASS |
| `npm run build` | PASS |
| `uv run uvicorn backend.main:app --host 127.0.0.1 --port 8000` | PASS |
| `npm run dev` | PASS |
| `curl -i http://127.0.0.1:8000/auth/me` | PASS: 401 unauthenticated |
| `curl -D - -o /dev/null http://127.0.0.1:8000/auth/google/start` | PASS: 302 Google redirect |

## Auth redirect

Configured production redirect URI:

`https://consultin.alleysa.web.id/auth/google/callback`

Google OAuth full callback was not completed locally because Google OAuth is registered to the production domain. Local QA used register/email fallback for app flow, plus `/auth/google/start` redirect smoke.

## Browser QA

| Check | Result | Evidence |
|---|---:|---|
| Runtime app uses root `src/` | PASS | Initial QA found stale `frontend/src/`; synced to runtime `src/`. |
| Login page loads | PASS | `Masuk ke Akun` visible. |
| Google login visible/enabled | PASS | Button text `Masuk dengan Google`. |
| Facebook login removed | PASS | Browser text/buttons contain no `Facebook`. |
| Phone OTP removed | PASS | Browser text contains no OTP/phone/WhatsApp auth path. |
| Register fallback works | PASS | Filled name/email/password and reached dashboard. |
| Dashboard loads after register fallback | PASS | `Meja Analisis Bisnis` visible. |
| Create brief CTA enables after input | PASS | `Susun brief` enabled after typing query. |
| Brief preparation path works | PASS | `Lengkapi informasi` appears after clicking. |
| Backend auth smoke | PASS | `/auth/me` 401, `/auth/google/start` 302. |
| Console errors | PASS | No uncaught console errors observed during checked flow. |

## Bugs found and fixed

1. Claude edited `frontend/src/...`, but runtime imports root `src/...`.
   - Synced auth changes to root `src/...`.
2. Vite dev proxy missed `/auth`.
   - Added `/auth` proxy to `vite.config.ts` and `frontend/vite.config.ts`.
3. Local stale SQLite DB at old path caused `no such table: oauth_states`.
   - Removed stale generated DB and restarted backend; new DB created at `data/auth.sqlite3`.
4. Dead HS256 helper remained in `backend/auth.py`.
   - Removed.
5. Auth SQLite default path wrote to backend folder.
   - Changed default to repo `data/auth.sqlite3`.

## Remaining local-service limits

- Redis is not running locally; `/health` may report `redis: unreachable` and real analysis backend can be limited. Auth flow does not depend on Redis.
- Full Google login callback requires production domain registration; local test only verifies redirect URL.

## Verdict

Ready for PR after final cleanup, fresh verification, commit, and push.
