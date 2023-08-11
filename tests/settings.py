import os

from configula import Configula

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

config = Configula()

SECRET_KEY = 'fake-key'
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
PAPERMERGE_CREATE_SPECIAL_FOLDERS = True

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

REDIS_URL = config.get('redis', 'url', default='redis://localhost:6379/0')
NOTIFICATION_URL = 'memory://localhost/'

# this settings still makes sense?
PAPERMERGE_NAMESPACE = config.get('main', 'namespace', default=None)

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.sites',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'papermerge.core.apps.CoreConfig',
    'papermerge.search.apps.SearchConfig',
    'django.contrib.contenttypes',
    'dynamic_preferences',
    'dynamic_preferences.users.apps.UserPreferencesConfig',
]

ROOT_URLCONF = 'tests.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'APP_DIRS': True,
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
    }
}

SEARCH_URL = 'xapian://index_db_test'

AUTH_USER_MODEL = "core.User"

USE_TZ = False
