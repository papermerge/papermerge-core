import os
from pathlib import Path

from papermerge.conf.settings import *  # noqa

DEBUG = True

PROJ_ROOT = Path(__file__).resolve().parent.parent

INSTALLED_APPS.extend(
    ['django_extensions', ]
)

MEDIA_ROOT = config.get(
    'main',
    'media_root',
    default=os.path.join(PROJ_ROOT, "media")
)

STATIC_ROOT = config.get(
    'main',
    'static_root',
    default=os.path.join(PROJ_ROOT, "static")
)

DATABASES = config.get_django_databases(proj_root=PROJ_ROOT)

LOCALE_PATHS = (
    PROJ_ROOT / Path('papermerge'),
)
