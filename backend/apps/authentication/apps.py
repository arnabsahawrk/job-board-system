from django.apps import AppConfig


class AuthenticationsConfig(AppConfig):
    name = "apps.authentication"

    def ready(self):
        import apps.authentication.signals  # noqa: F401
