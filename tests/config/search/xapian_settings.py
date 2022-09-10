from ..base import *   # noqa

INSTALLED_APPS += [
    'papermerge.search.apps.SearchConfig',
]

ROOT_URLCONF = 'tests.config.search.urls'

HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': 'xapian_backend.XapianEngine',
        'PATH': os.path.join(BASE_DIR, 'xapian_index'),
    },
}

HAYSTACK_DOCUMENT_FIELD = 'indexed_content'
