"""Celery application for the News Intelligence Platform.

The Celery app is initialised here and exposed through ``config.celery_app``
(see ``config/__init__.py``). Task modules are discovered from the installed
Django apps via ``autodiscover_tasks``. No tasks are registered yet; periodic
news ingestion will be added in a later milestone through
``settings.CELERY_BEAT_SCHEDULE``.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("news_intelligence")

# Reads every setting prefixed with ``CELERY_`` from Django settings.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Looks for a ``tasks.py`` module in each installed app (none exist yet).
app.autodiscover_tasks()

__all__ = ("app",)
