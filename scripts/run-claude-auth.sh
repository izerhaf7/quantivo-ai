#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export MAX_MCP_OUTPUT_TOKENS=50000

claude -p "$(cat <<'PROMPT'
Use @auth-implementer.
Read tasks/google-oauth-sqlite.md and execute it.
First use graphify commands from the task to understand the codebase.
Do not read or print secrets. Use env var names only.
If work takes a long time, keep going until validation passes or a concrete blocker appears.
Remove non-working auth distractions: Facebook login and phone-number OTP registration/verification.
After implementation, read tasks/playwright-e2e-qa.md and execute it before final answer.
Use Playwright MCP/browser testing for end-to-end QA, including frontend design and UI/UX effectiveness.
Do not push or create PR.
Run required validation before final answer.
PROMPT
)" \
  --allowedTools "Read,Edit,Write,Bash(graphify *),Bash(uv sync*),Bash(uv run*),Bash(npm run build*),Bash(npm run dev*),Bash(npm install*),Bash(npm i*),Bash(npx playwright*),Bash(python*),Bash(python3*),Bash(git status*),Bash(git diff*),Bash(curl http://localhost*),Bash(command -v*)" \
  --disallowedTools "Read(.env),Read(.env.*),Read(/home/anomalindra/Downloads/client_secret_*),Bash(git push*),Bash(rm -rf *),Bash(sudo *)" \
  --max-turns 35 \
  --fallback-model haiku
