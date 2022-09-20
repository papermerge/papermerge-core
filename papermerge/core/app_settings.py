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


settings = AppSettings(prefix="PAPERMERGE")
