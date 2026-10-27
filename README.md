# News Intelligence Platform

A news intelligence platform built as a Django + React monolith. **Milestone 1
(project foundation)** is implemented and verified: a runnable full-stack
skeleton with real health endpoints, PostgreSQL, Redis, Celery worker/beat,
a typed React dashboard shell that talks to the live API, Docker Compose for
development and a production-style variant, plus tests, linting and docs.

**Explicitly not in this milestone** (by design): ingestion, RSS/news APIs,
article models, NLP/ML, auth, microservices. The UI shows labelled
`PLACEHOLDER` / `NO DATA` states instead of fake numbers — every figure on
screen comes from the API or is visibly marked as not yet implemented.

- Architecture: [`docs/architecture.md`](docs/architecture.md)
- Configuration reference: [`docs/configuration.md`](docs/configuration.md)
- API reference: [`docs/api.md`](docs/api.md)

## Quickstart (development)

Prerequisites: **Docker Desktop** (Compose v2). Nothing else is required —
Python, Node and Postgres all run inside containers.

```bash
cp .env.example .env            # once; dev-safe defaults, never committed
docker compose up --build -d    # build + start all 6 services
docker compose ps               # wait until everything says (healthy)
```

Then open:

| URL | What |
|---|---|
| <http://localhost:5173> | Dashboard (Vite dev server, hot reload) |
| <http://localhost:8001/api/v1/health/> | Backend health (JSON) |
| <http://localhost:8001/api/v1/> | API metadata |

What you should see: the sidebar lists all 7 pages (Overview, News Feed,
Topics, Entities, Trends, Knowledge Graph, AI Briefings); the top bar shows
**“Backend online”** (a real poll of the API, cross-origin via CORS); the
System status card shows live version/uptime/database/redis latency; all KPI
cards and charts are labelled placeholders with `—` / `NO DATA`.

Stop everything with `docker compose down` (data volumes are kept; add `-v`
to wipe the database).

> **Windows/PowerShell note:** PowerShell 5.1 has no `&&` — chain commands
> with `;` and check `$LASTEXITCODE`. `make` may not be installed; every
> Makefile target is a plain command you can copy from the table below.

## Services and ports

| Service | Image | Dev port | Role |
|---|---|---|---|
| `frontend` | `node:24-alpine` | **5173** | Vite dev server (hot reload) |
| `backend` | `python:3.13-slim` | **8001 → 8000** | Django 5.2 + DRF |
| `worker` | same as backend | — | Celery worker (`celery -A config`) |
| `beat` | same as backend | — | Celery beat (explicit schedule path) |
| `db` | `postgres:16-alpine` | **5433 → 5432** | PostgreSQL 16 |
| `redis` | `redis:7-alpine` | **6379** | Celery broker/results |

Port choices are **machine-specific and configurable in `.env`**:

- Host **8000 is already taken** on this machine (Docker Desktop internal
  services), so the backend publishes **8001**.
- Host **5432 is held by a native PostgreSQL**, so the db publishes **5433**.
- Inside the compose network every service always uses the unshifted,
  DNS-based addresses (`db:5432`, `redis:6379`, `backend:8000`).

## How the services talk to each other

```
DEVELOPMENT (compose.yaml)
  browser ── http://localhost:5173 ──► frontend (Vite)      [intentionally no depends_on]
  browser ── http://localhost:8001 ──► backend:8000         (cross-origin → CORS is live)
  backend/worker/beat ──► db:5432, redis:6379               (compose DNS, never localhost)

PRODUCTION-STYLE (compose.production.yaml)
  browser ── http://localhost:8080 ──► nginx ──► /            static SPA build
                                             └► /api/* , /static/* ──► backend:8000 (same-origin)
  backend/worker/beat ──► db:5432, redis:6379   on an INTERNAL network
                                                  (no published ports, no egress)
```

Rules that keep this honest:

1. **Service DNS inside, published ports outside.** `localhost` inside a
   container means *that container* — every compose file uses `db`,
   `redis`, `backend` names only.
2. **Dev = direct browser→backend**, no Vite proxy, so CORS is exercised for
   real (`CORS_ALLOWED_ORIGINS` must list `http://localhost:5173`). **Prod =
   same-origin** through nginx (`PROD_VITE_API_BASE_URL` is empty), so no
   CORS is involved at all.
3. **Readiness gates startup** with `depends_on: condition:
   service_healthy` (never start-order alone): `db` → `backend` (which runs
   migrations as the *single* writer) → `worker`/`beat`. The frontend has no
   backend dependency: it must render and report failure accurately even
   when the API is down.
4. **Healthchecks use tools guaranteed present per image**: `pg_isready`,
   `redis-cli`, stdlib Python `urllib` (backend), `node -e` (frontend),
   `wget` (nginx), `celery inspect ping` (worker). No `curl` anywhere.

## Health checks

```bash
# 1) script (stdlib only, exit code 0/1, proxy-safe)
python scripts/smoke_test.py --base-url http://localhost:8001

# 2) plain curl
curl -fsS -H 'Accept: application/json' http://localhost:8001/api/v1/health/
curl -fsS -H 'Accept: application/json' http://localhost:8001/api/v1/health/ready/
```

Observed response shape (`/api/v1/health/ready/`):

```json
{"status":"ready","version":"0.1.0","timestamp":"…",
 "checks":{"database":{"status":"ok","latency_ms":0.7},
           "redis":{"status":"ok","latency_ms":1.2}}}
```

Semantics: db down → `503 unavailable`; redis down only → `200 degraded`
(HTTP still serves); everything up → `200 ready`. Endpoints return status,
latency and timestamps only — never SQL, credentials or stack traces
(failure paths are covered by tests).

## Commands

| Make target | Command it runs | Purpose |
|---|---|---|
| `make` / `make help` | — | List all targets |
| `make env` | `cp .env.example .env` | Create config once |
| `make up` | `docker compose up --build -d` | Start dev stack |
| `make down` / `make ps` / `make logs` | `docker compose …` | Stop / status / follow logs |
| `make smoke` | `scripts/smoke_test.py --base-url http://localhost:8001` | Health endpoints |
| `make prod-up` / `prod-down` / `prod-logs` / `prod-smoke` | `docker compose -f compose.production.yaml …` | Production-style stack |
| `make test` | `python -m pytest` | Backend tests (22) |
| `make lint` / `make fmt` / `make fmt-check` | `ruff check` / `ruff format` | Backend lint/format |
| `make typecheck` / `make frontend-lint` | `npm run typecheck` / `npm run lint` | Frontend TS + ESLint |
| `make frontend-build` | `npm run build` | Production bundle |
| `make check` | all gates | lint + fmt-check + tests + typecheck + lint |

Equivalent raw commands (what was actually executed on this machine —
see “Verification status”):

```bash
docker compose up --build -d
backend/.venv/Scripts/python.exe -m pytest            # Windows venv path
backend/.venv/Scripts/python.exe -m ruff check backend
backend/.venv/Scripts/python.exe -m ruff format --check backend
cd frontend && npm run typecheck && npm run lint && npm run build
```

## Host development (optional, without Docker for the app itself)

```bash
# Backend — Python 3.13
cd backend
python -m venv .venv && .venv/Scripts/activate        # Windows; use bin/ on POSIX
pip install -r requirements.txt
set DATABASE_URL=postgresql://news:dev-only-password@localhost:5433/news_intelligence  # PS: $env:DATABASE_URL='…'
python manage.py migrate
python manage.py runserver 0.0.0.0:8001

# Frontend — Node 24+
cd frontend
npm ci
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:8001
npm run dev                 # http://localhost:5173
```

Docker is still needed for PostgreSQL/Redis (or point `DATABASE_URL` /
`REDIS_URL` at any other instance).

## Production-style stack

This is a single-host, dev-grade deployment that exercises the production
code path (gunicorn, whitenoise, `config.settings.production`, nginx, split
networks) — **not** a hardened production topology (no TLS, replicas or
backups yet).

```bash
# 1) put a REAL secret into .env (the production settings refuse the template value)
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
#    → edit .env: DJANGO_SECRET_KEY='<generated value>'   (single-quoted!)

# 2) start
docker compose -f compose.production.yaml up --build -d   # or: make prod-up

# 3) verify
curl -fsS http://localhost:8080/api/v1/health/ready/      # or: make prod-smoke
open http://localhost:8080                               # SPA, indicator "Backend online"
```

Verified behaviour of this stack:

- Missing `DJANGO_SECRET_KEY` / `DJANGO_ALLOWED_HOSTS` / `POSTGRES_*` →
  compose refuses to start (`:?` required-variable syntax).
- Placeholder secret (`dev-only-…-change-me`) → backend exits loudly with
  `ImproperlyConfigured` (checked in `config/settings/production.py`).
- `db` and `redis` publish **no host ports** (internal network only).
- nginx serves the SPA with history fallback (`/feed` returns the app),
  proxies `/api/` + `/static/` to `backend:8000`, hides its version
  (`Server: nginx`), and exposes `/healthz` for its own healthcheck.

## Configuration

Copy `.env.example` → `.env` (git-ignored; never commit real values). It
documents every variable: secret key, debug flag, allowed hosts, DB/Redis
credentials and ports, CORS/CSRF origins, gunicorn tuning, the frontend API
base URL (`VITE_API_BASE_URL` for dev, `PROD_VITE_API_BASE_URL` for the prod
build — empty = same origin) and reserved placeholders for milestone-2 news
API credentials (`NEWS_API_KEY`).

Key rules (full reference in [`docs/configuration.md`](docs/configuration.md)):

- Compose builds **container-side URLs itself** (`db:5432`, `redis:6379`);
  the `DATABASE_URL`/`REDIS_URL` in `.env` are for *host* runs only.
- Quote `DJANGO_SECRET_KEY='…'` with single quotes — compose interpolates
  `$VARS` inside `.env` values and Django's keys may contain `$`.
- Changing `POSTGRES_PASSWORD` later does not rewrite an existing data
  volume; reset with `docker compose down -v` if you change it.

## Testing and linting

```bash
make check           # everything, or run the individual commands above
```

- **Backend:** pytest + pytest-django, **22 tests** — happy paths, readiness
  state machine (ready/degraded/unavailable), database-down failure paths
  (via an unreachable `DatabaseWrapper`, so they are real), “no leakage of
  SQL/credentials/stack traces”, API metadata. Tests use sqlite with
  `connect_timeout=1`, so they run without Docker.
- **Frontend:** `tsc --noEmit` (both tsconfigs), ESLint (0 errors/warnings),
  Vite production build.
- **Both:** ruff lint + format over 41 files.

## Project structure

```
├── compose.yaml                 # dev: frontend, backend, worker, beat, db, redis
├── compose.production.yaml      # gunicorn + nginx, split edge/internal networks
├── docker/
│   ├── backend.Dockerfile       # shared by dev + prod (command differs)
│   ├── backend-entrypoint.sh    # wait_for_db → migrate → collectstatic → exec
│   ├── frontend.Dockerfile      # Vite dev server (dev)
│   ├── frontend.production.Dockerfile  # multi-stage build → nginx
│   └── nginx/frontend.conf      # SPA + /api/ + /static/ proxy
├── backend/
│   ├── config/settings/{base,development,production,test}.py
│   ├── config/{urls,wsgi,celery}.py
│   └── apps/core/               # views (health/readiness/db/root) + tests
├── frontend/
│   └── src/
│       ├── components/layout/   # Shell, Sidebar (7 pages), TopBar, indicator
│       ├── features/health/     # HealthProvider – 20 s polling of 3 endpoints
│       ├── features/overview/   # KPI cards, chart placeholders, status card
│       ├── services/apiClient.ts# typed fetch wrapper (ApiError, timeouts)
│       └── pages/               # Overview + 6 placeholder pages
├── scripts/smoke_test.py        # stdlib health verification (exit 0/1)
├── docs/{architecture,configuration,api}.md
├── Makefile  README.md  .env.example  .dockerignore  .gitignore
```

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `port is already allocated` for 8000 | This machine squats 8000 — dev compose publishes **8001** by design; override `BACKEND_PORT` in `.env` if needed. |
| Backend restart-looping with `ImproperlyConfigured` | Production stack: missing or placeholder `DJANGO_SECRET_KEY`. Generate one (see above). |
| `docker compose config` warns `The "xx" variable is not set` | A `$…` inside `.env` is being interpolated — quote the value (`DJANGO_SECRET_KEY='…'`). |
| Frontend says “Backend offline” | Expected when the API is down — the card shows the real reason and a Retry button. `docker compose ps` to check; polling self-heals within 20 s. |
| Changed `POSTGRES_PASSWORD`, now auth fails | Existing volumes keep the old password: `docker compose down -v` (deletes dev data). |
| Stale frontend deps after lockfile change | Dev image runs `npm install` on start; if it still misbehaves: `docker compose down -v` (re-seeds the `frontend_node_modules` volume) or `docker compose build --no-cache frontend`. |
| OneDrive folder + bind mounts | Source is bind-mounted (`./backend`, `./frontend`); if a file was edited outside the mount, restart that container. |
| `make: command not found` (Windows) | Use the raw commands from the table above, WSL, or `choco install make`. |
| Windows `python` not on PATH | Use `backend\.venv\Scripts\python.exe` (as the Makefile's `smoke` target already falls back to). |
| Ports 5173/8080 busy | Set `FRONTEND_PORT` / `WEB_PORT` in `.env`. |

## Verification status (run on this machine, October 2026)

| Check | Result |
|---|---|
| `docker compose config` (dev) | ✅ valid |
| `docker compose -f compose.production.yaml config` | ✅ refuses without required vars; ✅ valid with them |
| `docker compose up --build -d` (dev, incl. full `down -v` wipe + fresh re-up) | ✅ all 6 services `(healthy)` |
| Dev smoke test (`scripts/smoke_test.py` → :8001) | ✅ 4/4 endpoints, `database=ok redis=ok` |
| Browser (dev :5173) | ✅ renders, “Backend online”, live `db/redis` latency; backend stopped → “Backend offline” + accurate error; restarted → self-healed within 20 s |
| `compose.production.yaml up --build -d` | ✅ all healthy |
| Production checks (:8080) | ✅ SPA + `/feed` fallback, `/healthz`, API proxied (`environment: "production"`), `/static/admin/…`, nginx version hidden, 404 without leaks |
| Browser (prod :8080) | ✅ “Backend online”, `Environment production` |
| `pytest` | ✅ 22 passed (~10.6 s) |
| `ruff check` / `ruff format --check` | ✅ clean / 41 files formatted |
| `manage.py check` | ✅ 0 issues |
| `npm run typecheck` / `npm run lint` / `npm run build` | ✅ exit 0 / 0 errors 0 warnings / CSS 25.85 kB, JS 342 kB |
| Makefile | ✅ parsed + `help` executed under GNU make (alpine container); each target’s underlying command run directly — `make` itself is not installed on this Windows host |
| Fresh-clone dependency install (`pip install -r`, `npm ci`) | ✅ used to create the pinned venv/node_modules during this build |
| Visual screenshot of the UI | ⚠️ not captured (headless harness has no visible desktop); UI verified via DOM reads instead |

## Milestone 2 outlook

Ingestion workers (RSS + news APIs, credentials already reserved in
`.env`), first real models/migrations, article list on the News Feed page
replacing the placeholders, and OpenAPI once resources exist. Decisions
already settled here that milestone 2 should build on: API versioning under
`/api/v1/`, JSON-only error responses (add a DRF catch-all 404), Celery
task queue naming, and the readiness contract (`ready`/`degraded`/
`unavailable`) as the deployment gate.
