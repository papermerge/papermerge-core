from .base import *   # noqa

INSTALLED_APPS += [
    'papermerge.search.apps.SearchConfig',
]

PAPERMERGE_SEARCH_CONNECTION = {
    'ENGINE': 'papermerge.search.backends.manticore.ManticoreEngine',  # noqa
    'URL': 'http://127.0.0.1:9306/'
}

