"""Shared helpers for the core test suite."""

from django.db.utils import ConnectionHandler

# A PostgreSQL configuration that cannot be reached: port 1 on localhost
# refuses connections immediately (no DNS lookup, no hang).
BROKEN_DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "unreachable",
        "USER": "unreachable",
        "PASSWORD": "unreachable",
        "HOST": "127.0.0.1",
        "PORT": "1",
        "CONN_MAX_AGE": 0,
        "CONN_HEALTH_CHECKS": False,
        # Bound the failed connection attempt so tests are fast and
        # deterministic even on machines where raw TCP refusals are slow.
        "OPTIONS": {"connect_timeout": 1},
    }
}


def unreachable_connection() -> object:
    """Return a real, fully configured DatabaseWrapper that cannot connect.

    Django deliberately does not rebuild cached connection wrappers when
    ``settings.DATABASES`` is overridden (it emits a warning for exactly this
    case), so failure-path tests swap the connection *object* instead. The
    wrapper is still a genuine Django/psycopg connection attempt against a
    closed port - nothing about the failure itself is mocked.
    """
    handler = ConnectionHandler({"default": dict(BROKEN_DATABASES["default"])})
    return handler["default"]
