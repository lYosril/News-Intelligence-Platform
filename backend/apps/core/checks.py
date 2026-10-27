"""Dependency health checks used by the API health endpoints.

Each check returns a small, serialisable dict containing only:

* ``status``: ``"ok"`` or ``"unavailable"``
* ``latency_ms``: round-trip time in milliseconds, or ``None``

Exception messages, connection strings, credentials and stack traces are
deliberately never included: health endpoints are often reachable from
semi-public networks.
"""

from __future__ import annotations

import time
from typing import Any

from django.conf import settings
from django.db import connection


def _elapsed_ms(started: float) -> float:
    return round((time.perf_counter() - started) * 1000, 1)


def check_database() -> dict[str, Any]:
    """Run a trivial query on the default database connection."""
    started = time.perf_counter()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:  # noqa: BLE001 - details must not leak to the client
        return {"status": "unavailable", "latency_ms": None}
    return {"status": "ok", "latency_ms": _elapsed_ms(started)}


def check_redis() -> dict[str, Any]:
    """Ping the Redis instance used as Celery broker and cache backend."""
    started = time.perf_counter()
    client = None
    try:
        import redis

        client = redis.Redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=1.0,
            socket_timeout=1.0,
        )
        client.ping()
    except Exception:  # noqa: BLE001 - details must not leak to the client
        return {"status": "unavailable", "latency_ms": None}
    finally:
        if client is not None:
            client.close()
    return {"status": "ok", "latency_ms": _elapsed_ms(started)}
