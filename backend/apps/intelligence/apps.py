from django.apps import AppConfig


class IntelligenceConfig(AppConfig):
    """Intelligence app: knowledge graph and AI briefings.

    Models and generation logic arrive in later milestones.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.intelligence"
    label = "intelligence"
    verbose_name = "Intelligence"
