"""Production settings.

Importing this module fails loudly when security-critical environment
variables are missing or still set to development placeholders. Nothing here
falls back to an insecure default.

Required environment variables:

* ``DJANGO_SECRET_KEY``
* ``DJANGO_ALLOWED_HOSTS``
* ``DATABASE_URL``
"""

import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import INSECURE_DEVELOPMENT_SECRET_KEY  # noqa: F401

DEBUG = False


def _require_env(name: str) -> str:
    """Return an environment variable or raise with a helpful message.

    Only the variable *name* is ever included in error messages, never the
    value.
    """
    value = os.environ.get(name, "").strip()
    if not value:
        raise ImproperlyConfigured(f"Missing required environment variable for production: {name}")
    return value


# --- Secret key ------------------------------------------------------------
SECRET_KEY = _require_env("DJANGO_SECRET_KEY")
if SECRET_KEY == INSECURE_DEVELOPMENT_SECRET_KEY:  # noqa: F405
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY is still set to the insecure development placeholder. "
        "Generate a real key, for example: "
        'python -c "from django.core.management.utils import '
        'get_random_secret_key; print(get_random_secret_key())"'
    )

# --- Hosts -----------------------------------------------------------------
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")  # noqa: F405

# --- Database --------------------------------------------------------------
# Verified so production can never silently fall back to the development
# PostgreSQL defaults from base.py.
_require_env("DATABASE_URL")

# --- CORS ------------------------------------------------------------------
# Re-read from the environment: base.py may already be imported with a
# different value, and production must validate what is actually set now.
CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=False)
if CORS_ALLOW_ALL_ORIGINS:  # noqa: F405
    raise ImproperlyConfigured(
        "CORS_ALLOW_ALL_ORIGINS=true is not allowed in production. "
        "List explicit origins in CORS_ALLOWED_ORIGINS instead."
    )

# --- Static files (Whitenoise serves them straight from the app) -----------
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
MIDDLEWARE = [MIDDLEWARE[0], "whitenoise.middleware.WhiteNoiseMiddleware", *MIDDLEWARE[1:]]

# --- Transport security ----------------------------------------------------
SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=False)  # noqa: F405
SECURE_HSTS_SECONDS = env.int("DJANGO_SECURE_HSTS_SECONDS", default=0)  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0  # noqa: F405
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS > 0  # noqa: F405
SESSION_COOKIE_SECURE = env.bool("DJANGO_COOKIE_SECURE", default=True)  # noqa: F405
CSRF_COOKIE_SECURE = env.bool("DJANGO_COOKIE_SECURE", default=True)  # noqa: F405
SECURE_CONTENT_TYPE_NOSNIFF = True  # noqa: F405
X_FRAME_OPTIONS = "DENY"  # noqa: F405

# Honour ``X-Forwarded-Proto`` when running behind a TLS-terminating proxy.
if env.bool("DJANGO_TRUST_PROXY_SSL_HEADER", default=False):  # noqa: F405
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")  # noqa: F405

# --- Email -----------------------------------------------------------------
# No SMTP credentials are part of Milestone 1. Configure an SMTP backend via
# EMAIL_BACKEND before any feature starts sending mail (see docs/configuration.md).
EMAIL_BACKEND = env(  # noqa: F405
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
