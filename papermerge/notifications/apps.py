from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    name = 'papermerge.notifications'
    label = 'notifications'

    def ready(self):
        from papermerge.core import signals  # noqa
