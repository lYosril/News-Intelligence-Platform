from django.apps import AppConfig


class SourcesConfig(AppConfig):
    """Sources app: RSS feeds, news APIs and provider credentials.

    Models and integrations arrive in Milestone 2 (ingestion).
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sources"
    label = "sources"
    verbose_name = "Sources"
