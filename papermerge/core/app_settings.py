import os
from os.path import expanduser

from django.conf import settings as django_settings


class AppSettings():
    """
    papermerge.core settings and their defaults
    """

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

    @property
    def DEFAULT_FILE_STORAGE(self):
        return self._settings(
            "DEFAULT_FILE_STORAGE",
            "papermerge.core.lib.storage.FileSystemStorage"
        )

    @property
    def FILE_STORAGE_KWARGS(self):
        return self._settings(
            "FILE_STORAGE_KWARGS",
            {}
        )

    @property
    def BINARY_FILE(self):
        return self._settings(
            "BINARY_FILE",
            "/usr/bin/file"
        )

    @property
    def BINARY_CONVERT(self):
        return self._settings(
            "BINARY_CONVERT",
            "/usr/bin/convert"
        )

    @property
    def BINARY_PDFTOPPM(self):
        return self._settings(
            "BINARY_PDFTOPPM",
            "/usr/bin/pdftoppm"
        )

    @property
    def BINARY_PDFINFO(self):
        return self._settings(
            "BINARY_PDFINFO",
            "/usr/bin/pdfinfo"
        )

    @property
    def BINARY_IDENTIFY(self):
        return self._settings(
            "BINARY_IDENTIFY",
            "/usr/bin/identify"
        )

    @property
    def BINARY_OCR(self):
        return self._settings(
            "BINARY_OCR",
            "/usr/bin/tesseract"
        )

    @property
    def BINARY_STAPLER(self):
        value = self._settings(
            "BINARY_STAPLER",
            None
        )
        # guess where BINARY_STAPLER is located
        if not value:  # if BINARY_STAPLER was not set in papermerge.conf.py
            try:  # maybe it is in virtual environment?
                value = f"{os.environ['VIRTUAL_ENV']}/bin/stapler"
            except Exception:
                # crude guess
                home_dir = expanduser('~')
                value = f"{home_dir}/.local/bin/stapler"

        return value

    @property
    def CONFIG_ENV_NAME(self):
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
    def IMPORT_MAIL_HOST(self):
        return self._settings(
            "IMPORT_MAIL_HOST",
            None
        )

    @property
    def IMPORT_MAIL_USER(self):
        return self._settings(
            "IMPORT_MAIL_USER",
            None
        )

    @property
    def IMPORT_MAIL_PASS(self):
        return self._settings(
            "IMPORT_MAIL_PASS",
            None
        )

    @property
    def IMPORT_MAIL_INBOX(self):
        return self._settings(
            "IMPORT_MAIL_INBOX",
            "INBOX"
        )

    @property
    def IMPORT_MAIL_SECRET(self):
        return self._settings(
            "IMPORT_MAIL_SECRET",
            None
        )

    @property
    def IMPORT_MAIL_BY_USER(self):
        return self._settings(
            "IMPORT_MAIL_BY_USER",
            None
        )

    @property
    def IMPORT_MAIL_BY_SECRET(self):
        return self._settings(
            "IMPORT_MAIL_BY_SECRET",
            None
        )

    @property
    def IMPORT_MAIL_DELETE(self):
        return self._settings(
            "IMPORT_MAIL_DELETE",
            False
        )

    @property
    def IMPORTER_DIR(self):
        return self._settings(
            "IMPORTER_DIR",
            None
        )


settings = AppSettings(prefix="PAPERMERGE")
