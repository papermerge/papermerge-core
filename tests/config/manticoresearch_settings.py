from .base import *   # noqa

INSTALLED_APPS += [
    'papermerge.search.apps.SearchConfig',
]

PAPERMERGE__SEARCH__ENGINE = 'papermerge.search.backends.manticore.ManticoreEngine'  # noqa
PAPERMERGE__SEARCH__URL = '127.0.0.1:9306'
