from django.apps import AppConfig


class PublicApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "public_api"
    verbose_name = "Public API"

    def ready(self):
        # Import the drf-spectacular extension so Swagger knows how to render
        # the X-API-Key security scheme for these endpoints.
        from . import schema  # noqa: F401
