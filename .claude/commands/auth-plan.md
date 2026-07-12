Read `tasks/google-oauth-sqlite.md`.

Before reading code files, run:
```bash
graphify update . --no-cluster
graphify query "Where are frontend auth/login state and backend API routes defined? Include files and symbols." --budget 2500
graphify explain "LoginView()"
graphify explain "api"
graphify explain "JobStore"
```

Then implement plan with @auth-implementer.

Do not read/print secrets. Use env names only.
