"""Core API routes (mounted under /api/v1/)."""

from django.urls import path

from apps.core import views

app_name = "core"

urlpatterns = [
    path("health/", views.HealthView.as_view(), name="health"),
    path("health/ready/", views.ReadinessView.as_view(), name="health-ready"),
    path(
        "health/database/",
        views.DatabaseHealthView.as_view(),
        name="health-database",
    ),
]
