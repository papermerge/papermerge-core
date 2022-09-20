import yaml
import logging.config

from corsheaders.defaults import default_headers as default_cors_headers
from configula import Configula
from papermerge.core.openapi.append import JSONAPI_COMPONENTS


logger = logging.getLogger(__name__)

config = Configula()

ALLOWED_HOSTS = config.get(
    'main',
    'allowed_hosts',
    default=['*']
)

redis_host = config.get('redis', 'host', default='127.0.0.1')
redis_port = config.get('redis', 'port', default=6379)

CELERY_BROKER_URL = f"redis://{redis_host}:{redis_port}/0"
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TASK_CREATE_MISSING_QUEUES = True
CELERY_TASK_DEFAULT_EXCHANGE = 'papermerge'
CELERY_TASK_DEFAULT_EXCHANGE_TYPE = 'direct'
CELERY_TASK_DEFAULT_ROUTING_KEY = 'papermerge'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [(redis_host, redis_port)],
        },
    },
}

DEBUG = config.get('main', 'debug', False)
PAPERMERGE_NAMESPACE = config.get('main', 'namespace', None)

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# Custom signal processor handles connections errors (to elasticsearch)
# and reports them as warnings. This way, even when no connection to ES
# is available, documents, folders, pages etc can still be used
ELASTICSEARCH_DSL_SIGNAL_PROCESSOR = 'papermerge.search.signals.CustomSignalProcessor'  # noqa

MEDIA_URL = config.get(
    'media',
    'url',
    default='/media/'
)

SECRET_KEY = config.get('main', 'secret_key')

SITE_ID = 1

STATIC_URL = config.get(
    'static',
    'dir',
    default='/static/'
)

PAPERMERGE_METADATA_DATE_FORMATS = [
    'dd.mm.yy',
    'dd.mm.yyyy',
    'dd.M.yyyy',
    'month'  # Month as locale’s full name, January, February
]

PAPERMERGE_METADATA_CURRENCY_FORMATS = [
    'dd.cc',
    'dd,cc'
]

PAPERMERGE_METADATA_NUMERIC_FORMATS = [
    'dddd',
    'd,ddd',
    'd.ddd'
]

PAPERMERGE_MIMETYPES = [
    'application/octet-stream',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/tiff'
]

# For each user create special folders
# i.e. create ".inbox" and ".home" folders
PAPERMERGE_CREATE_SPECIAL_FOLDERS = True

# Application definition

INSTALLED_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'knox',
    'rest_framework_json_api',
    'corsheaders',
    'drf_spectacular',
    'drf_spectacular_sidecar',
    'django.contrib.auth',
    'django.contrib.sites',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'papermerge.core.apps.CoreConfig',
    'papermerge.search.apps.SearchConfig',
    'papermerge.notifications.apps.NotificationsConfig',
    'django.contrib.contenttypes',
    'dynamic_preferences',
    'dynamic_preferences.users.apps.UserPreferencesConfig',
    'polymorphic_tree',
    'polymorphic',
    'mptt',
    'channels',
    'haystack',
]

# include elasticsearch apps only if PAPERMERGE_ELASTICSEARCH_HOSTS
# and PAPERMERGE_ELASTICSEARCH_PORT are defined
# and have non-empty value

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'core.User'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

if config.has_mysql:
    # Requires MySQL > 5.7.7 or innodb_large_prefix set to on
    SILENCED_SYSTEM_CHECKS = ['mysql.E001']

FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.TemporaryFileUploadHandler'
]

STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

LANGUAGES = [
    ('de', 'Deutsch'),
    ('en', 'English'),
    ('fr', 'Français'),
]
TIME_ZONE = config.get('main', 'timezone', default='Europe/Berlin')
USE_I18N = True
USE_L10N = True
USE_TZ = True
LANGUAGE_CODE = config.get(
    'main',
    'language_code',
    default='en'
)

DATE_FORMAT = '%d/%m/%Y'
DATE_INPUT_FORMATS = ['%d/%m/%Y']

# Password validation
# https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # knox token based authentication
        'knox.auth.TokenAuthentication',
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
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
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

REST_KNOX = {
  # Setting the TOKEN_TTL to None will create tokens that never expire.
  'TOKEN_TTL': None,
}

LOGGING_CFG_FILENAME = config.get('main', 'logging_cfg', None)
if LOGGING_CFG_FILENAME:
    dict_config = yaml.load(open(LOGGING_CFG_FILENAME), Loader=yaml.FullLoader)
    logging.config.dictConfig(dict_config)
else:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '%(levelname)s %(asctime)s %(module)s %(message)s'
            },
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose'
            },
        },
        'root': {
            'level': 'INFO',
            'handlers': ['console', ],
        },
        'loggers': {
            'django.db.backends': {
                'level': 'INFO',
                'handlers': ['console', ],
                'propagate': False,
            },
            'django.security.DisallowedHost': {
                'level': 'INFO',
                'handlers': ['console', ],
                'propagate': False,
            },
            'papermerge.core.tasks': {
                'level': 'DEBUG',
                'handlers': ['console', ],
                'propagate': True,
            },
            'celery': {
                'level': 'DEBUG',
                'handlers': ['console', ],
                'propagate': True,
            },
        },
    }

CORS_ALLOW_HEADERS = list(default_cors_headers) + [
    "Authorization",
    "Content-Disposition",
]

CORS_EXPOSE_HEADERS = ["Content-Disposition"]

CORS_ALLOW_ALL_ORIGINS = True


SPECTACULAR_SETTINGS = {
    'TITLE': 'Papermerge REST API',
    'DESCRIPTION': 'Document management system designed for digital archives',
    'VERSION': '2.1.0',
    'APPEND_COMPONENTS': JSONAPI_COMPONENTS
}

SEARCH_ENGINES_MAP = {
    'elastic': 'haystack.backends.elasticsearch7_backend.Elasticsearch7SearchEngine',
    'elastic7': 'haystack.backends.elasticsearch7_backend.Elasticsearch7SearchEngine',
    'elasticsearch7': 'haystack.backends.elasticsearch7_backend.Elasticsearch7SearchEngine',
    'elasticsearch': 'haystack.backends.elasticsearch7_backend.Elasticsearch7SearchEngine',
    'es7': 'haystack.backends.elasticsearch7_backend.Elasticsearch7SearchEngine',
    'es': 'haystack.backends.elasticsearch7_backend.Elasticsearch7SearchEngine',
    'solr': 'haystack.backends.solr_backend.SolrEngine',
    'whoosh': 'haystack.backends.whoosh_backend.WhooshEngine',
    'xapian': 'xapian_backend.XapianEngine',
}

HAYSTACK_DOCUMENT_FIELD = 'indexed_content'

search_engine = config.get('search', 'engine', default='xapian')


HAYSTACK_CONNECTIONS = {
    'default': {
        'ENGINE': SEARCH_ENGINES_MAP[search_engine],
    },
}

HAYSTACK_SIGNAL_PROCESSOR = 'papermerge.search.signals.SignalProcessor'
