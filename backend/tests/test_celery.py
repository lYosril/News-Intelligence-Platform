"""Tests for the Celery application wiring."""

from django.conf import settings
from django.test import SimpleTestCase


class CeleryConfigTests(SimpleTestCase):
    def test_celery_app_is_initialised(self) -> None:
        from config.celery import app

        self.assertEqual(app.main, "news_intelligence")
        self.assertEqual(app.conf.broker_url, settings.CELERY_BROKER_URL)
        self.assertEqual(app.conf.task_serializer, "json")
        self.assertEqual(app.conf.timezone, "UTC")

    def test_package_exposes_celery_app(self) -> None:
        import config

        self.assertTrue(hasattr(config, "celery_app"))

    def test_no_periodic_tasks_are_scheduled_yet(self) -> None:
        # Milestone 1 ships the scheduler plumbing but no ingestion tasks.
        self.assertEqual(settings.CELERY_BEAT_SCHEDULE, {})
