"""Development settings.

Safe, non-production defaults. These values are for local work only and are
never used silently in production: ``config.settings.production`` validates
that real values were supplied instead.
"""

from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = env.list(  # noqa: F405
    "DJANGO_ALLOWED_HOSTS",
    default=["localhost", "127.0.0.1", "backend"],
)

# Friendlier API experience while developing (JSON stays the default elsewhere).
REST_FRAMEWORK = {  # noqa: F405
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.BrowsableAPIRenderer",
        "rest_framework.renderers.JSONRenderer",
    ],
}

# Never e-mail in development; print to the console instead.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
