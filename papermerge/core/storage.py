import logging
from django.utils.module_loading import import_string
from django.conf import settings as django_settings

from .app_settings import settings


logger = logging.getLogger(__name__)


def get_storage_class(import_path=None):
    return import_string(
        import_path or settings.DEFAULT_FILE_STORAGE
    )


def get_storage_instance():
    storage_klass = get_storage_class()
    storage_kwargs = settings.FILE_STORAGE_KWARGS or {}
    storage_kwargs['location'] = django_settings.MEDIA_ROOT

    return storage_klass(**storage_kwargs)


def abs_path(some_relative_path):
    storage_instance = get_storage_instance()

    return storage_instance.abspath(some_relative_path)


# TODO: remove this code
storage_class = get_storage_class()

# TODO: remove this code
storage_kwargs = settings.FILE_STORAGE_KWARGS or {}
# This line will return '' if code runs before MEDIA_ROOT is being set
# e.g. when preforking in uwsgi
# Remove this code and access default storage only via `get_storage_instance`
storage_kwargs['location'] = django_settings.MEDIA_ROOT

# TODO: remove this code
default_storage = storage_class(**storage_kwargs)
