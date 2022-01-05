from .base import *   # noqa

INSTALLED_APPS += [
    'papermerge.search.apps.SearchConfig',
    'django_elasticsearch_dsl',
]

ELASTICSEARCH_DSL = {
    'default': {
        'hosts': 'localhost:9200'
    },
}
