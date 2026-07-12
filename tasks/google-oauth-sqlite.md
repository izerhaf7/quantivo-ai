# Task: Google OAuth + SQLite Auth

Goal: replace mocked auth with real Google OAuth sign-in backed by SQLite user/session tables.

Hard rules:
- Do not read or print `.env`, `.env.*`, or `/home/anomalindra/Downloads/client_secret_*.json`.
- Secrets already exist in repo-root `.env`; use env names only.
- Google OAuth is registered for production domain `https://consultin.alleysa.web.id`.
- Authorized redirect URI must be `https://consultin.alleysa.web.id/auth/google/callback`.
- Local full OAuth callback may not work; smoke redirect URL locally and use register/email fallback for E2E flow testing.
- Keep current UX/screens/flows. No visual redesign.
- Keep existing analysis API behavior.
- Minimal deps. Prefer stdlib SQLite (`sqlite3`) and signed/random opaque session cookie.
- Remove non-working auth distractions instead of leaving dead UI: remove Facebook login button, phone-number OTP registration/verification screens/routes/buttons, and any "coming soon" disabled social/OTP auth affordances.
- No password auth now unless needed to keep existing email form non-breaking; Google OAuth is priority.

Project facts:
- Backend: FastAPI in `backend/main.py`.
- Current backend store: Redis `JobStore` in `backend/store.py` for analysis jobs only.
- Frontend: React/Vite in `frontend/src/app/App.tsx`.
- Frontend API client: `frontend/src/app/api/client.ts`.
- Frontend mock auth adapter: `frontend/src/app/integration.ts` (`signIn` currently returns fake user).
- Login UI has disabled Google button near `SocialButtons` / `LoginView`.
- `graphify-out/graph.json` exists and is gitignored.

Use graphify first:
```bash
graphify update . --no-cluster
graphify query "Where are frontend auth/login state and backend API routes defined? Include files and symbols." --budget 2500
graphify explain "LoginView()"
graphify explain "api"
graphify explain "JobStore"
```

Required backend env names:
```text
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
GOOGLE_OAUTH_ALLOWED_DOMAINS
APP_SESSION_SECRET
SESSION_COOKIE_NAME
SESSION_COOKIE_SECURE
AUTH_SQLITE_PATH
```

Expected backend behavior:
1. `GET /auth/google/start`
   - Generate cryptographically random OAuth `state`.
   - Store state in SQLite with TTL, or signed state using `APP_SESSION_SECRET`.
   - Redirect to Google auth URL with scopes `openid email profile`.
2. `GET /auth/google/callback`
   - Validate `state`.
   - Exchange `code` against Google token endpoint.
   - Validate ID token claims against `GOOGLE_OAUTH_CLIENT_ID` and issuer.
   - Upsert user by Google `sub`/email.
   - Create random opaque session token, store only SHA-256 hash in SQLite.
   - Set HttpOnly session cookie; redirect to `/`.
3. `GET /auth/me`
   - Return current user if session cookie valid, else 401.
4. `POST /auth/logout`
   - Delete session, clear cookie.

SQLite minimum schema:
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
```

Expected frontend behavior:
- Add auth methods to `frontend/src/app/api/client.ts`: `me`, `logout` if useful.
- Google button enabled: `window.location.href = `${BASE_URL}/auth/google/start`` or same-origin `/auth/google/start`.
- Remove Facebook login UI entirely.
- Remove phone OTP registration/verification UI path entirely (`phonenumber`, `phoneverify`, related buttons/copy/handlers) if unused after Google OAuth.
- On app load, call `/auth/me`; if user exists, skip login to home.
- Logout calls backend `/auth/logout` then returns to login.
- Keep email/password form behavior acceptable for dev if not implementing password auth; do not break screens.

Validation commands:
```bash
uv sync
uv run python -m compileall backend contracts ml scraping
npm run build
```

Optional smoke if local services available:
```bash
uv run uvicorn backend.main:app --host 127.0.0.1 --port 8000
curl http://localhost:8000/health
curl -I http://localhost:8000/auth/google/start
```

Done criteria:
- No secrets printed or committed.
- `.env` remains gitignored.
- Build passes.
- Compile passes.
- `git diff` is small and focused.
