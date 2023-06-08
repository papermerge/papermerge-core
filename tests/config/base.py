import os
from configula import Configula

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

config = Configula()

SECRET_KEY = 'fake-key'
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
PAPERMERGE_CREATE_SPECIAL_FOLDERS = True
PAPERMERGE_NAMESPACE = config.get('main', 'namespace', default=None)

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

REDIS_URL = config.get('redis', 'url', default='redis://localhost:6379/0')

INSTALLED_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'knox',
    'django.contrib.auth',
    'django.contrib.sites',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'papermerge.core.apps.CoreConfig',
    'django.contrib.contenttypes',
    'dynamic_preferences',
    'dynamic_preferences.users.apps.UserPreferencesConfig',
]

ROOT_URLCONF = 'tests.config.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'APP_DIRS': True,
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

AUTH_USER_MODEL = "core.User"


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # basic authentication for browsable API
        'rest_framework.authentication.BasicAuthentication',
        # knox token based authentication
        'knox.auth.TokenAuthentication',
        # SessionAuthentication required to keep session for browsable API
        'rest_framework.authentication.SessionAuthentication',
    ],
    'PAGE_SIZE': 10,
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser'
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'rest_framework.filters.SearchFilter',
    ),
    'SEARCH_PARAM': 'filter[search]',
    'TEST_REQUEST_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.MultiPartRenderer'
    ),
    'TEST_REQUEST_DEFAULT_FORMAT': 'vnd.api+json'
}

FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.TemporaryFileUploadHandler'
]

USE_TZ = False
