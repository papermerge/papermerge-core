import os
from pathlib import Path

from papermerge.conf.settings import *  # noqa

DEBUG = False

PROJ_ROOT = Path(__file__).resolve().parent.parent

MEDIA_ROOT = config.get(
    'media',
    'dir',
    default=os.path.join(PROJ_ROOT, "media")
)

STATIC_ROOT = config.get(
    'static',
    'dir',
    default=os.path.join(PROJ_ROOT, "static")
)

DATABASES = config.get_django_databases(proj_root=PROJ_ROOT)

LOCALE_PATHS = (
    PROJ_ROOT / Path('papermerge'),
)
