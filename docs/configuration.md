# Configuration

All configuration is environment-driven. Nothing secret is ever committed:
`.env` and `frontend/.env` are git-ignored; only the documented templates
are tracked.

## Files

| File | Read by | Purpose |
|---|---|---|
| `.env.example` → copy to `.env` | Docker Compose (`${VAR}` interpolation) | Ports, DB/Redis credentials, Django env, API URLs |
| `frontend/.env.example` → copy to `frontend/.env` | Vite, **host runs only** | `VITE_API_BASE_URL` when you run `npm run dev` outside Docker |
| process environment | Django (`django-environ`) | Everything, including values compose injects |

Copy once, before the first start:

```bash
cp .env.example .env
# production-style stack additionally needs a real key:
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
# paste it into .env as: DJANGO_SECRET_KEY='<the generated value>'
```

> Quote the value with single quotes: compose performs `$VARIABLE`
> interpolation inside `.env` values, and Django's generated keys may
> contain `$`. (Symptom if unquoted: `The "xx" variable is not set` warnings
> on `docker compose up` and a silently mangled key.)

## Variables

### Ports (host side)

| Variable | Default | Used by | Notes |
|---|---|---|---|
| `BACKEND_PORT` | `8001` | dev compose | Host port for Django. **8000 is taken on this machine** by Docker Desktop internals — override only if 8001 is busy too. |
| `FRONTEND_PORT` | `5173` | dev compose | Vite dev server. |
| `POSTGRES_PORT` | `5433` | dev compose | Host port for PostgreSQL. 5432 is held by a native PostgreSQL here. Containers always use `db:5432`. |
| `REDIS_PORT` | `6379` | dev compose | Host port for Redis. |
| `WEB_PORT` | `8080` | production compose | nginx (SPA + `/api` proxy). |

### Database

| Variable | Default | Required | Notes |
|---|---|---|---|
| `POSTGRES_USER` | `news` | production: yes | Used by the db container **and** to build the container-side `DATABASE_URL`. |
| `POSTGRES_PASSWORD` | `dev-only-password` | production: yes | Dev default is intentionally weak; replace for anything real. |
| `POSTGRES_DB` | `news_intelligence` | no | |
| `DATABASE_URL` | `postgresql://news:dev-only-password@localhost:5433/news_intelligence` | — | **Host runs only.** The compose files build their own URL with the `db` service DNS name and deliberately ignore this variable, so a `localhost` here can never leak into a container. |

Changing `POSTGRES_PASSWORD` later does **not** rewrite the password inside
an existing data volume (Postgres initialises only on an empty data dir).
Either keep the old password or reset: `docker compose down -v` (deletes the
dev database).

### Django

| Variable | Dev default | Production | Notes |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | `dev-only-insecure-secret-key-change-me` | **required + must not be a placeholder** | `config.settings.production` refuses to boot with the template value (verified). |
| `DJANGO_DEBUG` | `true` | forced `false` | Boolean. |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1,backend` | **required**, no wildcards | Comma-separated hosts, no scheme/port. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,…,http://localhost:8080` | set, `*` rejected | Comma-separated full origins. Dev needs 5173 (browser→8001 direct). |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `http://localhost:5173,http://localhost:8080` | same pattern | Comma-separated origins with scheme. |
| `LOG_LEVEL` | `INFO` | `INFO` | Root logger level; Django request logs are emitted as structured JSON. |
| `DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | set by compose (service DNS) | set by compose | Only needed as environment variables for host runs; `.env` documents the host variants. |

Production validation (`config/settings/production.py`) fails with
`ImproperlyConfigured` — loudly, before serving anything — when a required
value is missing, empty, or a template placeholder. `docker compose -f
compose.production.yaml config` additionally refuses to interpolate a
production file with `DJANGO_SECRET_KEY` / `DJANGO_ALLOWED_HOSTS` /
`POSTGRES_*` unset (`:?` syntax), so a fresh checkout cannot silently start
"production" with dev secrets.

### Celery / gunicorn

| Variable | Default | Notes |
|---|---|---|
| `GUNICORN_WORKERS` | `3` | Production compose command. |
| `GUNICORN_TIMEOUT` | `60` | Seconds. |
| `CELERY_*` | `redis://redis:6379/0` | Broker + result backend, compose-injected. |

### Frontend

| Variable | Where | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | dev: process env (compose) / `frontend/.env` | **Origin** the *browser* uses to reach the API, e.g. `http://localhost:8001`. Empty string = same origin. Request paths themselves always include `/api/v1/...`. |
| `PROD_VITE_API_BASE_URL` | root `.env`, production compose build-arg | Empty (default) = same origin behind nginx (`/api/` proxied). Set only if the API lives on another origin. |

### Reserved for Milestone 2

`NEWS_API_KEY`, `NEWS_API_BASE_URL` — documented in `.env.example`, read by
nothing yet (no ingestion exists).

## Which URL is used where?

```
Host run (manage.py / celery on your machine):
    DATABASE_URL / REDIS_URL from .env  →  localhost ports (5433/6379)

Inside compose (any service):
    db:5432, redis:6379, backend:8000   →  compose DNS names, built by compose

Browser → backend:
    dev:  VITE_API_BASE_URL = http://localhost:<BACKEND_PORT>  (cross-origin, CORS)
    prod: VITE_API_BASE_URL = ""       (same origin, nginx proxies /api/)
```

The three layers never share a value on purpose: `localhost` in a container
means the container itself, which is the classic "works on my machine"
failure this setup avoids.
