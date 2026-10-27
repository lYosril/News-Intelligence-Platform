"""Production settings must fail loudly instead of falling back to
development defaults."""

import importlib
import sys

import pytest
from django.core.exceptions import ImproperlyConfigured

VALID_ENV = {
    "DJANGO_SECRET_KEY": "a-real-secret-key-with-ample-entropy-0123456789",
    "DJANGO_ALLOWED_HOSTS": "example.com",
    "DATABASE_URL": "postgresql://user:password@db.example.com:5432/news",
}


def _import_production(monkeypatch, **overrides):
    """(Re-)import config.settings.production with a controlled environment."""
    values = {**VALID_ENV, **overrides}
    for key in VALID_ENV:
        if values.get(key) is None:
            monkeypatch.delenv(key, raising=False)
        else:
            monkeypatch.setenv(key, values[key])
    sys.modules.pop("config.settings.production", None)
    return importlib.import_module("config.settings.production")


def test_production_rejects_development_secret_key(monkeypatch) -> None:
    with pytest.raises(ImproperlyConfigured, match="DJANGO_SECRET_KEY"):
        _import_production(monkeypatch, DJANGO_SECRET_KEY="dev-only-insecure-secret-key-change-me")


def test_production_requires_secret_key(monkeypatch) -> None:
    with pytest.raises(ImproperlyConfigured, match="DJANGO_SECRET_KEY"):
        _import_production(monkeypatch, DJANGO_SECRET_KEY=None)


def test_production_requires_allowed_hosts(monkeypatch) -> None:
    with pytest.raises(ImproperlyConfigured, match="DJANGO_ALLOWED_HOSTS"):
        _import_production(monkeypatch, DJANGO_ALLOWED_HOSTS=None)


def test_production_requires_database_url(monkeypatch) -> None:
    with pytest.raises(ImproperlyConfigured, match="DATABASE_URL"):
        _import_production(monkeypatch, DATABASE_URL=None)


def test_production_rejects_wildcard_cors(monkeypatch) -> None:
    monkeypatch.setenv("CORS_ALLOW_ALL_ORIGINS", "true")
    with pytest.raises(ImproperlyConfigured, match="CORS_ALLOW_ALL_ORIGINS"):
        _import_production(monkeypatch)


def test_production_loads_hardened_settings(monkeypatch) -> None:
    module = _import_production(monkeypatch)

    assert module.DEBUG is False
    assert module.SECRET_KEY == VALID_ENV["DJANGO_SECRET_KEY"]
    assert module.ALLOWED_HOSTS == ["example.com"]
    assert module.SESSION_COOKIE_SECURE is True
    assert module.CSRF_COOKIE_SECURE is True
    assert module.SECURE_CONTENT_TYPE_NOSNIFF is True
    assert module.X_FRAME_OPTIONS == "DENY"
    # Whitenoise serves static files without an external web server.
    assert "whitenoise.middleware.WhiteNoiseMiddleware" in module.MIDDLEWARE
    # The shared base middleware list must not be mutated by this import.
    from config.settings import base

    assert "whitenoise.middleware.WhiteNoiseMiddleware" not in base.MIDDLEWARE
