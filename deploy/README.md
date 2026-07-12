# Deploying BOA SaaS (real MVP) to the GCP VM

Target: `ubuntu@54.255.65.50` (2 vCPU / 3.7 GB RAM). Everything runs on this
one box: Redis + Qdrant in Docker, the FastAPI backend as a systemd service,
the built frontend served by nginx. LLM + embeddings are hosted API calls
(Fireworks) — no GPU/model weights on this box, which is why it fits.

**Status as of 2026-07-11: deployed and smoke-tested.** `http://54.255.65.50`
serves the app; backend + Redis + Qdrant are up. This doc is both the runbook
and a record of what was actually done.

## 0. The box was not empty

Before this deploy, the server was already running an earlier project of the
team's (ThingsBoard IoT platform + Postgres, a "9router" gateway, a
"headroom" proxy) — 3.2 of 3.7 GB RAM was in use and port 80 was already
claimed by two nginx sites. That setup had already been migrated elsewhere,
so it was stopped/disabled (not deleted — reversible) to make room:

```bash
sudo systemctl stop thingsboard 9router postgresql@16-main
sudo systemctl disable thingsboard 9router postgresql@16-main
pkill -f 'local/bin/headroom'; pkill -f 'next-server'
screen -S headroom -X quit   # headroom ran inside a detached GNU screen session
sudo rm -f /etc/nginx/sites-enabled/9router.conf /etc/nginx/sites-enabled/thingsboard.conf
```

This freed RAM from ~584 MB available to ~3.2 GB, and freed port 80 (neither
old site was `default_server`, both were scoped to specific DuckDNS domains,
so bare-IP requests would have hit whichever loaded first and 404'd). The old
`.conf` files are still in `/etc/nginx/sites-available/` if that setup is
ever needed again — only the `sites-enabled` symlinks were removed.
**If you're redeploying to a genuinely fresh box, skip this section.**

## 1. Prerequisites (once)

```bash
ssh -i server/kunci-mio ubuntu@54.255.65.50

# Docker + compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # log out/in (or `newgrp docker`) after this
# (or just prefix docker commands with `sudo` for the rest of this session)

# nginx — already installed on this box (1.24.0); skip if present
sudo apt-get update && sudo apt-get install -y nginx

# uv (Python package/venv manager, same one used in dev)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

No Node.js needed on the server — build the frontend **locally** and `scp`
the static `dist/` output instead. A 4 GB box doing an `npm install` +
`vite build` alongside everything else is an avoidable risk; building
locally (or in CI) and shipping static files is both simpler and lighter.

## 2. Get the code + secrets onto the server

```bash
# on the server
git clone https://github.com/izerhaf7/quantivo-ai.git ~/quantivo-ai
cd ~/quantivo-ai

# from your machine — the root .env is gitignored, copy it explicitly
scp -i server/kunci-mio .env ubuntu@54.255.65.50:~/quantivo-ai/.env
```

Fill in `.env` from `.env.example` first if you haven't — at minimum
`FIREWORKS_API_KEY` for the pipeline to produce a real report at all; the 8
scraper keys degrade gracefully if missing (`DATABOKS_API_KEY` is expected
to stay empty per current team decision).

> **First deploy note:** at the time this was first stood up, the real-MVP
> changes (this whole `deploy/` dir, the orchestrator real-wiring, the
> frontend API integration, etc.) were still uncommitted locally, not yet on
> GitHub `main`. Rather than commit+push unprompted, they were shipped
> directly via `tar`/`scp` on top of a plain `git clone` of `main`:
> `tar -czf changes.tar.gz <changed files/dirs>` locally, `scp` it over,
> `tar -xzf` on the server inside the clone. Once these changes are
> committed and pushed for real, future deploys are the normal `git pull`
> in step 8 below — this workaround is a one-time thing.

```bash
# on the server
cd ~/quantivo-ai
uv sync
```

## 4. Redis + Qdrant

```bash
sudo docker compose -f deploy/docker-compose.yml up -d
sudo docker compose -f deploy/docker-compose.yml ps      # both should show healthy
curl http://localhost:6333/healthz                        # -> "healthz check passed"
sudo docker exec -it $(sudo docker ps -qf name=redis) redis-cli ping   # -> PONG
```

## 5. Backend (systemd)

```bash
sudo cp deploy/boa-backend.service /etc/systemd/system/
# edit User=/WorkingDirectory=/PYTHONPATH=/EnvironmentFile=/ExecStart= paths
# in the copied unit file if the clone path or username differs from
# /home/ubuntu/quantivo-ai — see comments in the file itself
sudo systemctl daemon-reload
sudo systemctl enable --now boa-backend
sudo systemctl status boa-backend
curl http://localhost:8000/health    # -> {"status":"ok","redis":"ok"}
journalctl -u boa-backend -f         # tail logs
```

## 6. Frontend

Build **locally** (or wherever you have Node), then ship the static output:

```bash
# locally
cd frontend
npm ci
npm run build   # -> frontend/dist/

# ship it
scp -i server/kunci-mio -r dist/* ubuntu@54.255.65.50:/tmp/boa-dist/
```

```bash
# on the server
sudo mkdir -p /var/www/boa
sudo cp -r /tmp/boa-dist/* /var/www/boa/
sudo chown -R www-data:www-data /var/www/boa

sudo cp deploy/nginx-boa.conf /etc/nginx/sites-available/boa
sudo ln -sf /etc/nginx/sites-available/boa /etc/nginx/sites-enabled/boa
# remove/disable whatever else is currently claiming :80 first if this
# isn't a fresh box (see section 0) -- our nginx-boa.conf is
# `default_server`, nginx will fail to reload if another enabled site
# also claims default_server on the same port.
sudo nginx -t && sudo systemctl reload nginx
```

Frontend is served same-origin (nginx proxies `/api` and `/health` to the
backend on `127.0.0.1:8000`), so `VITE_API_BASE_URL` should stay unset for
this build — the default (same-origin) is correct in production.

## 7. Firewall

GCP firewall rule for TCP port 80 (inbound, source `0.0.0.0/0` for a public
demo) — this is a GCP console/`gcloud` action, not something done from
inside the VM. Port 22 (SSH) should already be open since you're SSH'd in.
**On this box it was already open** (leftover from the previous project's
setup) — verify with `curl http://54.255.65.50/` from a machine that isn't
the server itself before assuming you need to change anything.

## 8. Smoke test

From a device that is **not** this server:

1. Open `http://54.255.65.50` — should load the app (splash → login).
2. Log in (mocked — any email/password), submit a real business idea,
   answer the two clarification questions, confirm.
3. Watch the processing screen advance through real backend stages
   (scraping → routing → preprocessing → indexing → analyzing → composing).
4. Report renders with an LLM-written executive summary, real SWOT,
   competitors sourced from Google Places, and (if any source degraded)
   an honest "Some sources degraded" banner.
5. `curl http://54.255.65.50/health` → `{"status":"ok","redis":"ok"}`.
6. `free -h` on the server during a run — should stay well under 4 GB.

## Updating after a code change

```bash
# on the server
cd ~/quantivo-ai
git pull
uv sync                                # if deps changed
sudo systemctl restart boa-backend     # backend picks up new code
# frontend: rebuild locally, scp, cp into /var/www/boa again (step 4)
```

## Known limitations (documented, not deploy bugs)

- **No durable job queue**: `backend/main.py`'s `asyncio.create_task` means
  a backend restart mid-analysis loses that job (`TODO(arq)` in the code).
  Acceptable for a hackathon demo; don't restart the service mid-run.
- **BrightData Instagram/X modules** currently 404 on their Google-Search
  discovery step (`GOOGLE_SEARCH_DATASET_ID` in `scraping/modules/instagram.py`
  / `x_twitter.py`) — degrades gracefully (0 items), needs the correct
  dataset ID from the BrightData account dashboard to fix.
- **BPS module** 404s on its hardcoded dataset `var`/`model` query params —
  degrades gracefully (0 items); BPS's real WebAPI parameter catalog needs
  to be looked up to fix (their docs endpoint was unreachable from this dev
  environment when checked).
- **No HTTPS** — IP-only demo, no domain/cert configured.
