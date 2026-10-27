"""Django project package for the News Intelligence Platform."""

from config.celery import app as celery_app

__all__ = ("celery_app",)
