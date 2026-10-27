"""Test settings used by pytest-django.

SQLite keeps the foundation test suite fast and runnable without external
services. The health-check endpoints are exercised against a real database
connection (the in-memory SQLite test database), not mocks.
"""

from .development import *  # noqa: F403

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Fast hashing keeps auth-related tests snappy.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Nothing is scheduled in Milestone 1; make any future task run inline.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Tests assert on plain JSON, never the browsable API HTML.
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

# Email is captured instead of printed.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
