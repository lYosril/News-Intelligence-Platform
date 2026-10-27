# Architecture

Milestone 1 scope: project foundation. A runnable full-stack skeleton with
real health checks, background-job wiring, and a UI shell that talks to the
real backend. **No ingestion, no news APIs, no models beyond Django
internals, no auth, no NLP** — those arrive in later milestones.

## Services

| Service    | Image / base           | Role                                              | Dev port (host → container) |
|------------|------------------------|---------------------------------------------------|-----------------------------|
| `frontend` | `node:24-alpine`       | Vite dev server (dev) / nginx static+proxy (prod) | `5173 → 5173` (dev), `8080 → 8080` (prod) |
| `backend`  | `python:3.13-slim`     | Django + DRF + gunicorn (prod) / runserver (dev)  | `8001 → 8000` (dev only)    |
| `worker`   | same image as backend  | Celery worker                                     | —                           |
| `beat`     | same image as backend  | Celery beat scheduler                             | —                           |
| `db`       | `postgres:16-alpine`   | Primary database                                  | `5433 → 5432` (dev only)    |
| `redis`    | `redis:7-alpine`       | Celery broker/result backend, health check        | `6379 → 6379` (dev only)    |

> This machine squats host port **8000** (Docker Desktop internal services),
> so the backend publishes **8001** instead. Native PostgreSQL holds **5432**,
> so the db publishes **5433**. Both are configurable in `.env`
> (`BACKEND_PORT`, `POSTGRES_PORT`).

## Network topology

**Development** (`compose.yaml`): all services sit on one default network.
The browser is the only "outside" client:

```
browser ── http://localhost:5173 ──► frontend (Vite)        [no depends_on]
browser ── http://localhost:8001 ──► backend :8000          (CORS: 5173 allowed)
backend ── db:5432, redis:6379                             (service DNS)
worker/beat ── redis:6379, db:5432
```

- Service-to-service traffic always uses **compose DNS names** (`db`,
  `redis`, `backend`), never `localhost` — inside a container `localhost`
  means that container.
- The frontend deliberately has **no `depends_on`** on the backend: it must
  render and report an accurate connection state whether the API is up or
  down, and the two are developed independently.
- The browser calls the backend **directly** (no dev proxy), which keeps CORS
  honest: `CORS_ALLOWED_ORIGINS` in `.env` must actually allow
  `http://localhost:5173`, and you can see it working in the connection
  indicator.

**Production-style** (`compose.production.yaml`): two networks split trust:

```
                    ┌─────────── edge network ───────────┐
browser ── :8080 ─► │ frontend (nginx) ──► backend :8000  │
                    └────────────────────────────────────┘
                                             │
                    ┌──── internal network (no host ports) ────┐
                    └► db :5432, redis :6379 ◄─ worker, beat ───┘
```

- `db` and `redis` are attached **only** to the `internal` network, which is
  marked `internal: true`: no published ports, no egress, unreachable from
  the host or from anything outside the app.
- nginx terminates the browser: `/` is the static SPA build, `/api/` and
  `/static/` proxy to `backend:8000`. The browser therefore talks
  **same-origin**, and `PROD_VITE_API_BASE_URL` stays empty (the API client
  falls back to `window.location.origin`).

## Health model

| Endpoint | Meaning | Codes |
|---|---|---|
| `GET /api/v1/health/` | Liveness: process is up and can serve JSON | always `200 {"status":"ok"}` |
| `GET /api/v1/health/ready/` | Readiness: can this instance serve traffic? | `200 ready` (db+redis ok), `200 degraded` (db ok, redis down — nothing is broken for HTTP traffic yet), `503 unavailable` (db down) |
| `GET /api/v1/health/database/` | Database reachability + measured latency | `200 ok`, `503 unavailable` |
| `GET /api/v1/` | API metadata (version, environment, endpoint index) | `200` |

Design rules:

- Every probe has a **hard timeout** (`OPTIONS.connect_timeout=3` in
  Django, `1` in tests): on this machine psycopg can hang for minutes on a
  closed port otherwise, and a health check that hangs is worse than one
  that fails.
- Responses contain only status, latency and timestamps — **never** SQL,
  credentials, settings or stack traces. Failure paths are covered by tests
  (`apps/core/tests/`).
- Container healthchecks use tools that are guaranteed present in each
  image: `pg_isready` (postgres), `redis-cli` (redis), stdlib Python `urllib`
  (backend), `node -e` (frontend dev), `wget` (nginx). Celery worker uses
  `celery inspect ping | grep -q 'OK'`.
- Readiness is **gated by `depends_on: condition: service_healthy`** wherever
  order matters; `depends_on` alone (start order without health) is never
  used for correctness.

## Startup sequence (single migration writer)

```
db (healthy) ─► backend: wait_for_db → migrate → runserver/gunicorn (healthy)
                                   ├─► worker: wait_for_db → celery worker (healthy)
                                   └─► beat:   wait_for_db → celery beat
frontend: independent (nginx prod waits for backend healthy only to avoid
          serving an app whose API is not ready yet - the app itself would
          cope)
```

`docker/backend-entrypoint.sh` implements the wait with `django.db` +
`connect_timeout`, runs `migrate` only when `RUN_MIGRATIONS=1` (backend
service), and `collectstatic` only when `RUN_COLLECTSTATIC=1` (production).
Worker and beat start only after the backend is healthy, so migrations have
already been applied — **no race between migration writers**.

## Backend layout

```
backend/
├── manage.py
├── requirements.txt            # pinned, incl. gunicorn + whitenoise for prod
├── config/
│   ├── settings/
│   │   ├── base.py             # everything shared; env-driven; UTC; logging
│   │   ├── development.py      # DEBUG from env, permissive CORS defaults
│   │   ├── production.py       # required-env validation + placeholder
│   │   │                       #   secret rejection + whitenoise
│   │   └── test.py             # sqlite, fast connect_timeout, quiet logs
│   ├── urls.py                 # /api/v1/ → apps.core.urls
│   ├── wsgi.py, celery.py      # gunicorn / celery entry points
├── apps/core/                  # the only app in milestone 1
│   ├── views.py                # ApiRootView, Health, Readiness, Database
│   ├── urls.py
│   └── tests/                  #22 tests incl. failure paths (db down,
│                               #   redis down, non-JSON, error leakage)
```

Settings split: `base.py` reads *everything* from the environment with
django-environ; `production.py` **fails fast** if `DJANGO_SECRET_KEY`,
`DJANGO_ALLOWED_HOSTS` or `POSTGRES_*` are missing/placeholder, and rejects
wildcard CORS. Development values live in `.env.example`; nothing secret is
ever committed.

## Frontend layout

```
frontend/
├── src/
│   ├── App.tsx, main.tsx       # router + providers
│   ├── components/layout/      # Shell, Sidebar (7 pages), TopBar
│   │   └── ConnectionIndicator.tsx
│   ├── features/health/        # HealthProvider - polls the 3 endpoints
│   │   │                       #   every 20 s, shared app-wide
│   ├── hooks/useHealthCheck.ts
│   ├── services/apiClient.ts   # typed fetch: ApiError, timeouts,
│   │                           #   same-origin fallback, safe messages
│   ├── pages/                  # Overview + 6 placeholder pages
│   └── features/overview/      # KPI cards, chart placeholders, status card
```

- All four KPI cards and all chart slots render **`PLACEHOLDER` / `NO DATA`
  with an explicit caption** — there is no fake data anywhere; numbers only
  appear when they come from the API (system status: latency, uptime,
  version).
- `VITE_API_BASE_URL` semantics: **origin (or empty for same-origin)**, the
  per-request paths carry `/api/v1/...`. Dev: `http://localhost:8001`.
  Prod build: empty → nginx proxies.
- Failure UX: indicator switches to "Backend offline", the status card shows
  the real cause ("Could not reach the backend at …" /
  "The backend responded with status …") plus a **Retry now** button; polling
  continues, so the UI self-heals when the backend returns (verified both
  ways).

## Celery wiring

`config/celery.py` creates the app from `config.settings` (`celery -A
config`), broker and result backend come from `CELERY_BROKER_URL` /
`CELERY_RESULT_BACKEND` (compose sets `redis://redis:6379/0`). No tasks exist
yet in milestone 1 — worker and beat are proven live by their healthchecks
(worker answers `inspect ping`). Scheduled tasks land with ingestion in
milestone 2; beat already runs with an explicit schedule path.

## Deliberate decisions (for milestone 2)

1. **Direct browser→backend in dev** keeps CORS visible and testable; a Vite
   proxy would hide it. Production is same-origin via nginx instead of CORS.
2. **Backend owns migrations**; worker/beat only wait. A migration job
   service can replace this later if zero-downtime deploys become a goal.
3. **Two compose files, one image** for backend (command differs: runserver
   vs gunicorn), so dev and prod test the same code path.
4. **`degraded` vs `unavailable`**: Redis being down must not fail
   orchestrators while HTTP serving still works (no Redis in the request
   path yet) — revisit when ingestion makes Redis load-bearing.
5. Unknown `/api/...` paths currently return Django's minimal production
   404 page (no leaks, verified) rather than JSON; a DRF catch-all JSON 404
   is a small milestone-2 nicety.
