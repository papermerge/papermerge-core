import logging
from django.utils.module_loading import import_string
from django.conf import settings as django_settings

from .app_settings import settings


logger = logging.getLogger(__name__)


def get_storage_class(import_path=None):
    return import_string(
        import_path or settings.DEFAULT_FILE_STORAGE
    )


storage_class = get_storage_class()

storage_kwargs = settings.FILE_STORAGE_KWARGS or {}

default_storage = storage_class(
    location=django_settings.MEDIA_ROOT,
    **storage_kwargs
)


def abs(some_relative_path):
    return default_storage.abspath(some_relative_path)
