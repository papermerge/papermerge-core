from django.conf import settings as django_settings


class AppSettings():
    """
    papermerge.core settings and their defaults
    """

    def __init__(self, prefix):
        self.prefix = prefix

    def _settings(self, name, default_value):
        full_name = f"{self.prefix}_{name}"
        value = getattr(
            django_settings,
            full_name,
            default_value,
        )
        return value

    @property
    def TASK_MONITOR_STORE_CLASS(self):  # noqa
        return self._settings(
            "TASK_MONITOR_STORE_CLASS",
            "papermerge.core.task_monitor.store.RedisStore"
        )

    @property
    def TASK_MONITOR_STORE_URL(self):  # noqa
        return self._settings(
            "TASK_MONITOR_STORE_URL",
            "redis://localhost/0"
        )

    @property
    def TASK_MONITOR_STORE_KEYS_TIMEOUT(self):  # noqa
        # in memory store keys (redis keys TTL) timeout
        # in seconds
        return self._settings(
            "TASK_MONITOR_STORE_KEYS_TIMEOUT",
            1200  # in seconds
        )

    @property
    def DEFAULT_FILE_STORAGE(self):  # noqa
        return self._settings(
            "DEFAULT_FILE_STORAGE",
            "papermerge.core.lib.storage.FileSystemStorage"
        )

    @property
    def FILE_STORAGE_KWARGS(self):  # noqa
        return self._settings(
            "FILE_STORAGE_KWARGS",
            {}
        )

    @property
    def BINARY_FILE(self):  # noqa
        return self._settings(
            "BINARY_FILE",
            "/usr/bin/file"
        )

    @property
    def BINARY_CONVERT(self):  # noqa
        return self._settings(
            "BINARY_CONVERT",
            "/usr/bin/convert"
        )

    @property
    def BINARY_IDENTIFY(self):  # noqa
        return self._settings(
            "BINARY_IDENTIFY",
            "/usr/bin/identify"
        )

    @property
    def BINARY_OCR(self):  # noqa
        return self._settings(
            "BINARY_OCR",
            "/usr/bin/tesseract"
        )

    @property
    def CONFIG_ENV_NAME(self):  # noqa
        """
        Name of environment variable pointing to
        papermerge.conf.py file.

        Useful in case papermerge.conf.py file is neither
        in root folder nor in /etc/papermerge.conf.py
        """
        return self._settings(
            "DEFAULT_CONFIG_ENV_NAME",
            "PAPERMERGE_CONFIG"
        )

    @property
    def IMPORT_MAIL_HOST(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_HOST",
            None
        )

    @property
    def IMPORT_MAIL_USER(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_USER",
            None
        )

    @property
    def IMPORT_MAIL_PASS(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_PASS",
            None
        )

    @property
    def IMPORT_MAIL_INBOX(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_INBOX",
            "INBOX"
        )

    @property
    def IMPORT_MAIL_SECRET(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_SECRET",
            None
        )

    @property
    def IMPORT_MAIL_BY_USER(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_BY_USER",
            None
        )

    @property
    def IMPORT_MAIL_BY_SECRET(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_BY_SECRET",
            None
        )

    @property
    def IMPORT_MAIL_DELETE(self):  # noqa
        return self._settings(
            "IMPORT_MAIL_DELETE",
            False
        )

    @property
    def IMPORTER_DIR(self):  # noqa
        return self._settings(
            "IMPORTER_DIR",
            None
        )

    @property
    def PAPERMERGE_OCR_LANGUAGES(self):  # noqa
        default_value = {
            "deu": "Deutsch",
            "eng": "English",
        }
        return self._settings(
            'PAPERMERGE_OCR_LANGUAGES',
            default_value
        )

    @property
    def PAPERMERGE_OCR_DEFAULT_LANGUAGE(self):  # noqa
        return self._settings(
            'PAPERMERGE_OCR_DEFAULT_LANGUAGE',
            'deu'
        )



settings = AppSettings(prefix="PAPERMERGE")
