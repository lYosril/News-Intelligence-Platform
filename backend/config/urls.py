"""URL configuration for the News Intelligence Platform API."""

from django.contrib import admin
from django.urls import include, path

from apps.core.views import ApiRootView

urlpatterns = [
    # API root metadata must be registered before the include so that the
    # exact path /api/v1/ resolves to it while /api/v1/health/ falls through
    # to the core app.
    path("api/v1/", ApiRootView.as_view(), name="api-root"),
    path("api/v1/", include("apps.core.urls")),
    path("admin/", admin.site.urls),
]
