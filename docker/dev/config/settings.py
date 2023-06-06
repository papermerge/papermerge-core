import os
from pathlib import Path
import dj_database_url


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

DATABASES = {
    'default': dj_database_url.config(
        env='PAPERMERGE__DATABASE__URL',
        conn_max_age=600,
    ),
}

search_engine = config.get('search', 'engine', default='xapian')

if search_engine == 'xapian':
    HAYSTACK_CONNECTIONS['default']['PATH'] = config.get(
        'search',
        'path',
        default=os.path.join(PROJ_ROOT, 'xapian_index')
    )
elif search_engine == 'whoosh':
    HAYSTACK_CONNECTIONS['default']['PATH'] = config.get(
        'search',
        'path',
        default=os.path.join(PROJ_ROOT, 'whoosh_index')
    )
elif search_engine in (
        'es7',
        'es',
        'elasticsearch7',
        'elasticsearch',
        'elastic',
        'elastic7',
        'solr'
):
    HAYSTACK_CONNECTIONS['default']['URL'] = config.get(
        'search',
        'url'
    )


PAPERMERGE_CREATE_SPECIAL_FOLDERS = False
