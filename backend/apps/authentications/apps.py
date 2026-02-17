from django.apps import AppConfig


class AuthenticationsConfig(AppConfig):
    name = "apps.authentications"

    def ready(self):
        import apps.authentications.signals  # noqa: F401
