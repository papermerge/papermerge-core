import os
from configula import Configula

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

config = Configula(
    prefix="PAPERMERGE",
    config_locations=[
        "/etc/papermerge.toml",
        "papermerge.toml"
    ],
    config_env_var_name="PAPERMERGE_CONFIG"
)


SECRET_KEY = 'fake-key'
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
PAPERMERGE_CREATE_SPECIAL_FOLDERS = True

redis_host = config.get('redis', 'host', default='127.0.0.1')
redis_port = config.get('redis', 'port', default=6379)

INSTALLED_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'knox',
    'rest_framework_json_api',
    'corsheaders',
    'django.contrib.auth',
    'django.contrib.sites',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'papermerge.core.apps.CoreConfig',
    'papermerge.notifications.apps.NotificationsConfig',
    'django.contrib.contenttypes',
    'dynamic_preferences',
    'dynamic_preferences.users.apps.UserPreferencesConfig',
    'polymorphic_tree',
    'polymorphic',
    'mptt',
    'channels',
]

ROOT_URLCONF = 'tests.config.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'APP_DIRS': True,
    },
]

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(redis_host, redis_port)],
        },
    },
}

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
    'EXCEPTION_HANDLER': 'rest_framework_json_api.exceptions.exception_handler',
    'DEFAULT_PAGINATION_CLASS':
        'rest_framework_json_api.pagination.JsonApiPageNumberPagination',
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework_json_api.parsers.JSONParser',
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser'
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework_json_api.renderers.JSONRenderer',
        'rest_framework.renderers.JSONRenderer',
        # If you're performance testing, you will want to use the browseable API
        # without forms, as the forms can generate their own queries.
        # If performance testing, enable:
        # 'example.utils.BrowsableAPIRendererWithoutForms',
        # Otherwise, to play around with the browseable API, enable:
        'rest_framework_json_api.renderers.BrowsableAPIRenderer'
    ),
    'DEFAULT_METADATA_CLASS': 'rest_framework_json_api.metadata.JSONAPIMetadata',
    'DEFAULT_SCHEMA_CLASS': 'rest_framework_json_api.schemas.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': (
        'rest_framework_json_api.filters.OrderingFilter',
        'rest_framework_json_api.django_filters.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
    ),
    'SEARCH_PARAM': 'filter[search]',
    'TEST_REQUEST_RENDERER_CLASSES': (
        'rest_framework_json_api.renderers.JSONRenderer',
    ),
    'TEST_REQUEST_DEFAULT_FORMAT': 'vnd.api+json'
}
