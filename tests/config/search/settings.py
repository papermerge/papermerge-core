from ..base import *   # noqa

INSTALLED_APPS += [
    'papermerge.search.apps.SearchConfig',
]

ROOT_URLCONF = 'tests.config.search.urls'

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.elasticsearch7_backend.Elasticsearch7SearchEngine',
        'URL': 'http://127.0.0.1:9200/',
        'INDEX_NAME': 'haystack',
    },
}

HAYSTACK_DOCUMENT_FIELD = 'indexed_content'
