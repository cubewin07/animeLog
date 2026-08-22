from django.apps import AppConfig


class AnimelogConfig(AppConfig):
    name = 'animeLog'

    def ready(self):
        import animeLog.signals  # noqa: F401
