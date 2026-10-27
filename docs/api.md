# API (Milestone 1)

Base URLs:

| Stack | From the browser | Inside the compose network |
|---|---|---|
| Development | `http://localhost:8001/api/v1/` | `http://backend:8000/api/v1/` |
| Production-style | `http://localhost:8080/api/v1/` (nginx → `backend:8000`) | `http://backend:8000/api/v1/` |

All endpoints are **`GET`-only, unauthenticated** in milestone 1 (health and
metadata are intentionally public; authentication arrives with real data in
a later milestone). Responses are JSON — add `Accept: application/json` (or
`?format=json`) when using `curl`, because the **development** server also
offers DRF's browsable HTML renderer for browsers that send no `Accept`
header. Production and the test suite are JSON-only.

## `GET /api/v1/`

Service metadata and an index of the health endpoints.

```json
{
  "name": "News Intelligence Platform API",
  "description": "Foundation API: service metadata and health checks. News ingestion, analytics and intelligence endpoints will be added in later milestones.",
  "version": "0.1.0",
  "api_version": "v1",
  "environment": "development",
  "endpoints": {
    "health": "/api/v1/health/",
    "readiness": "/api/v1/health/ready/",
    "database": "/api/v1/health/database/"
  },
  "timestamp": "2026-10-27T15:37:33+00:00"
}
```

`environment` is derived from `settings.DEBUG` (`development` / `production`)
and was observed as `production` when running `compose.production.yaml`.

## `GET /api/v1/health/`

Liveness. Performs **no dependency checks** on purpose: one unavailable
dependency must never make the process look dead. Always `200`.

```json
{
  "status": "ok",
  "service": "news-intelligence-api",
  "version": "0.1.0",
  "api_version": "v1",
  "timestamp": "2026-10-27T15:44:48+00:00",
  "uptime_seconds": 945.3
}
```

`Cache-Control: no-store` is set on every health response.

## `GET /api/v1/health/ready/`

Readiness with dependency detail:

| Condition | HTTP | `status` |
|---|---|---|
| database + redis reachable | `200` | `ready` |
| database reachable, redis down | `200` | `degraded` (HTTP serving works; background processing does not) |
| database unreachable | `503` | `unavailable` |

```json
{
  "status": "ready",
  "version": "0.1.0",
  "timestamp": "2026-10-27T15:37:33+00:00",
  "checks": {
    "database": { "status": "ok", "latency_ms": 0.7 },
    "redis":    { "status": "ok", "latency_ms": 1.2 }
  }
}
```

When a dependency is down the failed check becomes
`{"status": "unavailable", "latency_ms": null}` — **exception messages,
connection strings and credentials are never included** (the check code
swallows all exceptions by design; covered by failure-path tests).

## `GET /api/v1/health/database/`

Dedicated database probe, useful for startup gating:

```json
{
  "status": "ok",
  "timestamp": "2026-10-27T15:44:48+00:00",
  "check": "database",
  "detail": { "status": "ok", "latency_ms": 7.3 }
}
```

`503 {"status": "unavailable", ...}` when the database cannot be reached.

## Errors

- Unknown `/api/...` paths return Django's minimal production `404`
  page ("Not Found", 179 bytes, no traceback, no settings) — verified by
  scanning the response for `Traceback`/`DJANGO_SETTINGS`/`SECRET` markers.
  A DRF-style JSON catch-all 404 is deferred to milestone 2.
- Health endpoints never return `500`: dependency failures are represented
  in the payload/status as shown above.

## Timeouts and probes

- Every database attempt uses `connect_timeout=3` (tests: `1`) so a
  unreachable host fails fast instead of hanging (psycopg can block for
  minutes otherwise).
- The container healthcheck polls `/api/v1/health/` every 10 s with a 3 s
  timeout (stdlib Python inside the image).
- The frontend polls health + readiness + database every **20 s** with an 8 s
  client-side timeout.

## Verification

```bash
# development (after `docker compose up -d`)
./scripts/smoke_test.py --base-url http://localhost:8001   # or: make smoke

# production-style (after `docker compose -f compose.production.yaml up -d`)
./scripts/smoke_test.py --base-url http://localhost:8080   # or: make prod-smoke

# single check with curl
curl -fsS -H 'Accept: application/json' http://localhost:8001/api/v1/health/ready/
```

`scripts/smoke_test.py` is stdlib-only (no requests, no proxy involvement)
and exits `0`/`1`, so it works in CI as-is.

> OpenAPI/Swagger generation is intentionally **not** part of milestone 1;
  it becomes useful once real resources exist (milestone 2).
