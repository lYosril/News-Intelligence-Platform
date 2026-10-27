#!/bin/sh
# Entrypoint for the backend container (dev and prod).
# - waits for PostgreSQL using django.db (honours the connect_timeout OPTIONS),
# - runs migrations once (only when RUN_MIGRATIONS=1; the backend service is the
#   single migration writer, worker/beat start only after it is healthy),
# - collects static files when RUN_COLLECTSTATIC=1 (production),
# - then execs the given command.
set -eu

log() {
    printf '%s [entrypoint] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

wait_for_db() {
    python - <<'PY'
import os
import sys
import time

import django

django.setup()

from django.db import connections
from django.db.utils import OperationalError

max_attempts = int(os.environ.get("DB_WAIT_MAX_ATTEMPTS", "45"))
delay = float(os.environ.get("DB_WAIT_DELAY_SECONDS", "2"))
last_error = None

for attempt in range(1, max_attempts + 1):
    try:
        connections["default"].ensure_connection()
    except OperationalError as exc:
        last_error = exc
        if attempt == 1 or attempt % 5 == 0:
            print(
                f"[entrypoint] waiting for database "
                f"(attempt {attempt}/{max_attempts}): {last_error}",
                flush=True,
            )
        time.sleep(delay)
    else:
        print(f"[entrypoint] database reachable (attempt {attempt})", flush=True)
        sys.exit(0)

print(f"[entrypoint] database NOT reachable after {max_attempts} attempts", flush=True)
sys.exit(1)
PY
}

log "starting"
wait_for_db

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
    log "applying database migrations"
    python manage.py migrate --noinput
fi

if [ "${RUN_COLLECTSTATIC:-0}" = "1" ]; then
    log "collecting static files"
    python manage.py collectstatic --noinput --verbosity 0
fi

log "exec: $*"
exec "$@"
