import os
from pathlib import Path
from corsheaders.defaults import default_headers as default_cors_headers
from configula import Configula


config = Configula(
    prefix="PAPERMERGE",
    config_locations=[
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

redis_host = config.get('redis', 'host', default="127.0.0.1")
redis_port = config.get('redis', 'port', default=6379)

CELERY_BROKER_URL = f"redis://{redis_host}:{redis_port}/0"

CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_WORKER_CONCURENCY = 1
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

DEBUG = False

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

ELASTICSEARCH_DSL = {
    'default': {
        'hosts': 'localhost:9200'
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

# This is where Papermerge will look for PDFs to index
PAPERMERGE_IMPORTER_DIR = config.get(
    "IMPORTER_DIR",
    None
)

PAPERMERGE_FILES_MIN_UNMODIFIED_DURATION = config.get_var(
    "FILES_MIN_UNMODIFIED_DURATION",
    1
)

PAPERMERGE_IMPORTER_LOOP_TIME = config.get_var(
    "IMPORTER_LOOP_TIME",
    5
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
    'rest_framework_json_api',
    'corsheaders',
    'django.contrib.auth',
    'django.contrib.sites',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'papermerge.core.apps.CoreConfig',
    'papermerge.notifications.apps.NotificationsConfig',
    'papermerge.search.apps.SearchConfig',
    'django.contrib.contenttypes',
    'dynamic_preferences',
    'dynamic_preferences.users.apps.UserPreferencesConfig',
    'polymorphic_tree',
    'polymorphic',
    'mptt',
    'channels',
    'django_elasticsearch_dsl'
]

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
        'rest_framework.authentication.TokenAuthentication',
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
            'level': 'INFO',
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
        'papermerge': {
            'level': 'INFO',
            'handlers': ['console', ],
            'propagate': False,
        },
    },
}

CORS_ALLOW_HEADERS = list(default_cors_headers) + [
    "Authorization",
    "Content-Disposition",
]

INTERNAL_IPS = ['127.0.0.1', ]

CORS_ALLOW_ALL_ORIGINS = True
