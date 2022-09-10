from ..base import *   # noqa

INSTALLED_APPS += [
    'papermerge.search.apps.SearchConfig',
]

ROOT_URLCONF = 'tests.config.search.urls'

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'haystack.backends.whoosh_backend.WhooshEngine',
        'PATH': os.path.join(BASE_DIR, 'whoosh_index'),
    },
}

HAYSTACK_DOCUMENT_FIELD = 'indexed_content'
