import os
import yaml
import logging
import logging.config
from pathlib import Path
from corsheaders.defaults import default_headers as default_cors_headers
from configula import Configula
from papermerge.core.openapi.append import JSONAPI_COMPONENTS


logger = logging.getLogger(__name__)

config = Configula(
    prefix="PAPERMERGE",
    config_locations=[
        "/etc/papermerge/papermerge.toml",
        "/etc/papermerge.toml",
        "papermerge.toml"
    ],
    config_env_var_name="PAPERMERGE_CONFIG"
)


# Build paths inside the project like this: BASE_DIR / 'subdir'.
PROJ_ROOT = Path(__file__).resolve().parent.parent


ALLOWED_HOSTS = config.get_var(
    'allowed_hosts',
    default=['*']
)

redis_host = config.get('redis', 'host', default='127.0.0.1')
redis_port = config.get('redis', 'port', default=6379)

es_hosts = config.get('elasticsearch', 'hosts', default=None)
es_port = config.get('elasticsearch', 'port', default=None)

CELERY_BROKER_URL = f"redis://{redis_host}:{redis_port}/0"
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_WORKER_HOSTNAME = os.environ.get('HOSTNAME', default="hostname")
CELERY_WORKER_CONCURRENCY = config.get('worker', 'concurrency', default=1)
CELERY_WORKER_QUIET = config.get('worker', 'quiet', default=True)
CELERY_WORKER_BEAT = config.get('worker', 'beat', default=True)
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

DEBUG = config.get('main', 'debug', True)

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

if es_hosts and es_port:
    ELASTICSEARCH_DSL = {
        'default': {
            'hosts': config.get(
                'elasticsearch',
                'hosts',
                default=f"{es_hosts}:{es_port}"
            )
        },
    }

MEDIA_ROOT = config.get(
    'media',
    'dir',
    default=os.path.join(PROJ_ROOT, "media")
)

MEDIA_URL = config.get(
    'media',
    'url',
    default='/media/'
)

SECRET_KEY = config.get_var('secret_key')

SITE_ID = 1

STATIC_ROOT = config.get(
    'static',
    'dir',
    default=os.path.join(PROJ_ROOT, "static")
)

STATIC_URL = config.get(
    'static',
    'dir',
    default='/static/'
)

PAPERMERGE_OCR_DEFAULT_LANGUAGE = config.get(
    'ocr',
    'default_language',
    default='deu'
)

PAPERMERGE_OCR_LANGUAGES = config.get(
    'ocr',
    'language',
    default={
        'deu': 'Deutsch',
        'eng': 'English',
    }
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

PAPERMERGE_TASK_MONITOR_STORE_URL = f"redis://{redis_host}:{redis_port}/0"

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
    'papermerge.notifications.apps.NotificationsConfig',
    'django.contrib.contenttypes',
    'dynamic_preferences',
    'dynamic_preferences.users.apps.UserPreferencesConfig',
    'polymorphic_tree',
    'polymorphic',
    'mptt',
    'channels',
    'django_extensions'
]

# include elasticsearch apps only if PAPERMERGE_ELASTICSEARCH_HOSTS
# and PAPERMERGE_ELASTICSEARCH_PORT are defined
# and have non-empty value
if es_hosts and es_port:
    INSTALLED_APPS.extend([
        'papermerge.search.apps.SearchConfig',
        'django_elasticsearch_dsl'
    ])

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


DATABASES = config.get_django_databases(proj_root=PROJ_ROOT)

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
TIME_ZONE = 'Europe/Berlin'
USE_I18N = True
USE_L10N = True
USE_TZ = True
LANGUAGE_CODE = config.get_var(
    'language_code',
    default='en'
)


LOCALE_PATHS = (
    PROJ_ROOT / Path('papermerge'),
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


# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


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
    dict_config = yaml.load(open(LOGGING_CFG_FILENAME))
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
