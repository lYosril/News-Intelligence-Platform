"""Wait until the database accepts connections.

Used by the container entrypoint so backend startup is deterministic:
the web process and migrations only run once PostgreSQL is reachable.
"""

import time

from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = (
        "Block until the default database accepts connections, then exit. "
        "Exits with an error when the timeout is reached."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--timeout",
            type=float,
            default=30.0,
            help="Maximum seconds to wait (default: 30).",
        )
        parser.add_argument(
            "--interval",
            type=float,
            default=1.0,
            help="Seconds between attempts (default: 1).",
        )

    def handle(self, *args, **options) -> None:
        timeout: float = options["timeout"]
        interval: float = options["interval"]
        deadline = time.monotonic() + timeout
        attempt = 0

        while True:
            attempt += 1
            try:
                connection.ensure_connection()
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
            except Exception as exc:  # noqa: BLE001 - reported generically
                if time.monotonic() >= deadline:
                    raise CommandError(
                        f"Database still unavailable after {timeout:.0f}s ({type(exc).__name__})."
                    ) from exc
                self.stdout.write(
                    f"Database not ready (attempt {attempt}, "
                    f"{type(exc).__name__}); retrying in {interval:g}s..."
                )
                time.sleep(interval)
            else:
                connection.close()
                self.stdout.write(self.style.SUCCESS(f"Database ready (attempt {attempt})."))
                return
