"""API views: root metadata and health/readiness endpoints.

These are the only endpoints in Milestone 1. Article, analytics and
intelligence endpoints arrive in later milestones.
"""

from __future__ import annotations

import time

from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core import checks
from apps.core.version import __version__

SERVICE_NAME = "news-intelligence-api"
API_VERSION = "v1"

# Used for the uptime report; not sensitive.
_PROCESS_STARTED_AT = time.time()


def _timestamp() -> str:
    return timezone.now().isoformat()


class ApiRootView(APIView):
    """Public metadata describing the API and its available endpoints."""

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request) -> Response:
        return Response(
            {
                "name": "News Intelligence Platform API",
                "description": (
                    "Foundation API: service metadata and health checks. "
                    "News ingestion, analytics and intelligence endpoints "
                    "will be added in later milestones."
                ),
                "version": __version__,
                "api_version": API_VERSION,
                "environment": "production" if not settings.DEBUG else "development",
                "endpoints": {
                    "health": reverse("core:health"),
                    "readiness": reverse("core:health-ready"),
                    "database": reverse("core:health-database"),
                },
                "timestamp": _timestamp(),
            }
        )


class HealthView(APIView):
    """Liveness probe: reports that the process is up and serving requests.

    Deliberately performs no dependency checks so that a single unavailable
    dependency cannot make the application appear dead.
    """

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request) -> Response:
        response = Response(
            {
                "status": "ok",
                "service": SERVICE_NAME,
                "version": __version__,
                "api_version": API_VERSION,
                "timestamp": _timestamp(),
                "uptime_seconds": round(time.time() - _PROCESS_STARTED_AT, 1),
            }
        )
        response["Cache-Control"] = "no-store"
        return response


class ReadinessView(APIView):
    """Readiness probe: dependency status for the API process.

    * database unavailable -> HTTP 503 ``unavailable`` (cannot serve requests)
    * redis unavailable    -> HTTP 200 ``degraded``   (API works, background
      processing does not)
    * everything healthy   -> HTTP 200 ``ready``
    """

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request) -> Response:
        database = checks.check_database()
        redis = checks.check_redis()

        if database["status"] != "ok":
            overall = "unavailable"
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE
        elif redis["status"] != "ok":
            overall = "degraded"
            http_status = status.HTTP_200_OK
        else:
            overall = "ready"
            http_status = status.HTTP_200_OK

        response = Response(
            {
                "status": overall,
                "version": __version__,
                "timestamp": _timestamp(),
                "checks": {
                    "database": database,
                    "redis": redis,
                },
            },
            status=http_status,
        )
        response["Cache-Control"] = "no-store"
        return response


class DatabaseHealthView(APIView):
    """Dedicated database readiness check (useful for startup gating)."""

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request) -> Response:
        database = checks.check_database()
        http_status = (
            status.HTTP_200_OK
            if database["status"] == "ok"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        response = Response(
            {
                "status": "ok" if database["status"] == "ok" else "unavailable",
                "timestamp": _timestamp(),
                "check": "database",
                "detail": database,
            },
            status=http_status,
        )
        response["Cache-Control"] = "no-store"
        return response
