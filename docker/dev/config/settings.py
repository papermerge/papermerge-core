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
