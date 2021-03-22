from django.conf import settings as django_settings


class AppSettings():

    def __init__(self, prefix):

        self.prefix = prefix

    def _settings(self, name, default_value):
        full_name = self.prefix + name
        value = getattr(
            django_settings,
            full_name,
            default_value,
        )
        return value

    @property
    def TASK_MONITOR_STORE_CLASS(self):
        return self._settings(
            "TASK_MONITOR_STORE_CLASS",
            "papermerge.core.task_monitor.store.RedisStore"
        )

    @property
    def TASK_MONITOR_STORE_URL(self):
        return self._settings(
            "TASK_MONITOR_STORE_URL",
            "redis://localhost/0"
        )

    @property
    def TASK_MONITOR_STORE_KEYS_TIMEOUT(self):
        # in memory store keys (redis keys TTL) timeout
        # in seconds
        return self._settings(
            "TASK_MONITOR_STORE_KEYS_TIMEOUT",
            1200  # in seconds
        )


settings = AppSettings(prefix="PAPERMERGE")
