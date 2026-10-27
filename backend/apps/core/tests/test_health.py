"""Integration tests for the public API foundation endpoints.

These tests exercise the real Django/DRF stack against a real database
connection (the SQLite test database). The only environment-dependent part
is Redis, which may or may not be running on the host; tests accept either
outcome and assert the response shape instead.

Failure-path tests swap in a real DatabaseWrapper pointing at a closed port
(see ``helpers.unreachable_connection``) because Django does not rebuild
cached connections when ``settings.DATABASES`` is overridden at runtime.
"""

from unittest import mock

from django.conf import settings
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from apps.core import checks
from apps.core.tests.helpers import unreachable_connection


class ApiRootTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

    def test_api_root_returns_metadata(self) -> None:
        response = self.client.get("/api/v1/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["api_version"], "v1")
        self.assertIn("version", payload)
        self.assertIn("endpoints", payload)
        self.assertEqual(payload["endpoints"]["health"], "/api/v1/health/")
        self.assertEqual(payload["endpoints"]["readiness"], "/api/v1/health/ready/")
        self.assertEqual(payload["endpoints"]["database"], "/api/v1/health/database/")
        self.assertIn("timestamp", payload)


class HealthEndpointTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

    def test_health_reports_ok_without_leaking_secrets(self) -> None:
        response = self.client.get("/api/v1/health/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["service"], "news-intelligence-api")
        self.assertIn("version", payload)
        self.assertIn("uptime_seconds", payload)
        self.assertIn("timestamp", payload)

        body = response.content.decode()
        self.assertNotIn("Traceback", body)
        self.assertNotIn(settings.SECRET_KEY, body)
        password = settings.DATABASES["default"].get("PASSWORD")
        if password:
            self.assertNotIn(password, body)

    def test_health_response_is_not_cacheable(self) -> None:
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_readiness_reports_service_checks(self) -> None:
        response = self.client.get("/api/v1/health/ready/")

        # The SQLite test database is always reachable, so readiness can
        # never be 503 here.
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn(payload["status"], ("ready", "degraded"))

        database = payload["checks"]["database"]
        self.assertEqual(database["status"], "ok")
        self.assertIsNotNone(database["latency_ms"])

        # Redis may not be running on the developer machine.
        self.assertIn(payload["checks"]["redis"]["status"], ("ok", "unavailable"))

    def test_database_endpoint_reports_ok(self) -> None:
        response = self.client.get("/api/v1/health/database/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertEqual(payload["check"], "database")
        self.assertEqual(payload["detail"]["status"], "ok")


class UnreachableDatabaseTests(SimpleTestCase):
    """Behaviour of the health endpoints when PostgreSQL is down."""

    client_class = APIClient
    # Allows the swapped-in wrapper (alias "default") to attempt a real
    # connection; SimpleTestCase otherwise blocks all database access.
    databases = {"default"}

    def test_database_endpoint_reports_unavailable_without_details(self) -> None:
        with mock.patch.object(checks, "connection", unreachable_connection()):
            response = self.client.get("/api/v1/health/database/")

        self.assertEqual(response.status_code, 503)
        payload = response.json()
        self.assertEqual(payload["status"], "unavailable")
        self.assertEqual(payload["detail"]["status"], "unavailable")
        self.assertIsNone(payload["detail"]["latency_ms"])

        body = response.content.decode()
        self.assertNotIn("Traceback", body)
        # Connection details from the broken configuration must not leak.
        self.assertNotIn("unreachable", body)

    def test_readiness_fails_when_database_is_down(self) -> None:
        with mock.patch.object(checks, "connection", unreachable_connection()):
            response = self.client.get("/api/v1/health/ready/")

        self.assertEqual(response.status_code, 503)
        payload = response.json()
        self.assertEqual(payload["status"], "unavailable")
        self.assertEqual(payload["checks"]["database"]["status"], "unavailable")

    def test_check_database_returns_unavailable_for_real_failure(self) -> None:
        # Direct unit check: a genuine psycopg connection refusal is
        # translated into a safe, serialisable status dict.
        with mock.patch.object(checks, "connection", unreachable_connection()):
            result = checks.check_database()

        self.assertEqual(result["status"], "unavailable")
        self.assertIsNone(result["latency_ms"])


class CorsTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()

    def test_preflight_allows_configured_frontend_origin(self) -> None:
        response = self.client.options(
            "/api/v1/health/",
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Access-Control-Allow-Origin"], "http://localhost:5173")

    def test_preflight_rejects_unknown_origin(self) -> None:
        response = self.client.options(
            "/api/v1/health/",
            HTTP_ORIGIN="http://evil.example",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
        )

        self.assertNotEqual(response.get("Access-Control-Allow-Origin"), "http://evil.example")
