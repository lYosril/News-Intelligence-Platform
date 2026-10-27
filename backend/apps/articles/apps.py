from django.apps import AppConfig


class ArticlesConfig(AppConfig):
    """Articles app: source ingestion and deduplicated article storage.

    Models and migrations arrive in Milestone 2 (ingestion).
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.articles"
    label = "articles"
    verbose_name = "Articles"
