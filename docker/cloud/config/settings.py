from pathlib import Path

import dj_database_url

from papermerge.conf.settings import *  # noqa

DEBUG = False
TESTING = False

PROJ_ROOT = Path(__file__).resolve().parent.parent

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

DATABASES = {
    'default': dj_database_url.config(
        env='PAPERMERGE__DATABASE__URL',
        default='sqlite:////db/db.sqlite3',
        conn_max_age=0
    ),
}

SEARCH_URL = config.get(
    'search',
    'url',
    default=f'xapian:///{os.path.join(PROJ_ROOT, "index_db")}'
)

PAPERMERGE_CREATE_SPECIAL_FOLDERS = False
