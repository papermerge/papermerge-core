import os
from pathlib import Path

from papermerge.conf.settings import *  # noqa

DEBUG = False

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

DATABASES = config.get_django_databases(proj_root=PROJ_ROOT)

LOCALE_PATHS = (
    PROJ_ROOT / Path('papermerge'),
)

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
elif search_engine == 'solr':
    HAYSTACK_CONNECTIONS['default']['URL'] = config.get(
        'search',
        'url'
    )
elif search_engine in (
        'es7',
        'es',
        'elasticsearch7',
        'elasticsearch',
        'elastic',
        'elastic7'
):
    HAYSTACK_CONNECTIONS['default']['URL'] = config.get(
        'search',
        'url'
    )
    HAYSTACK_CONNECTIONS['default']['INDEX_NAME'] = config.get(
        'search',
        'index_name',
        default='papermerge'
    )
