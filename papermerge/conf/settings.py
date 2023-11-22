import logging.config
import os

import yaml
from configula import Configula

logger = logging.getLogger(__name__)

config = Configula()

ALLOWED_HOSTS = config.get(
    'main',
    'allowed_hosts',
    default=['*']
)

REDIS_URL = config.get('redis', 'url', default=None)

if REDIS_URL:
    CELERY_BROKER_URL = REDIS_URL
    NOTIFICATION_URL = REDIS_URL
else:
    CELERY_BROKER_URL = 'memory://localhost/'
    NOTIFICATION_URL = 'memory://localhost/'

CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TASK_CREATE_MISSING_QUEUES = True
CELERY_TASK_DEFAULT_EXCHANGE = 'papermerge'
CELERY_TASK_DEFAULT_EXCHANGE_TYPE = 'direct'
CELERY_TASK_DEFAULT_ROUTING_KEY = 'papermerge'


DEBUG = config.get('main', 'debug', False)
PAPERMERGE_NAMESPACE = config.get('main', 'namespace', None)

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

MEDIA_URL = config.get(
    'media',
    'url',
    default='/media/'
)

SECRET_KEY = config.get('security', 'secret_key')

SITE_ID = 1

STATIC_URL = config.get(
    'static',
    'dir',
    default='/static/'
)

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

# include elasticsearch apps only if PAPERMERGE_ELASTICSEARCH_HOSTS
# and PAPERMERGE_ELASTICSEARCH_PORT are defined
# and have non-empty value

MIDDLEWARE = [
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

TIME_ZONE = config.get('main', 'timezone', default='Europe/Berlin')

USE_I18N = True
USE_L10N = True
USE_TZ = True

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

OCR__DEFAULT_LANGUAGE = os.environ.get(
    'PAPERMERGE__OCR__DEFAULT_LANGUAGE',
    'deu'
)

LOGGING_CFG_FILENAME = os.environ.get(
    'PAPERMERGE__MAIN__LOGGING_CFG',
    '/core_app/logging.yml'
)
if os.path.exists(LOGGING_CFG_FILENAME):
    with open(LOGGING_CFG_FILENAME, 'r') as file:
        _logging_config = yaml.safe_load(file.read())
        logger.info(f"Loading logging configs from {LOGGING_CFG_FILENAME}")
        logging.config.dictConfig(_logging_config)
else:
    logger.info(f"Logging config {LOGGING_CFG_FILENAME} not found.")
    logger.info("Using default Django config for logging")
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
            'django.security.DisallowedHost': {
                'level': 'INFO',
                'handlers': ['console', ],
                'propagate': False,
            },
            'papermerge.core.signals': {
                'level': 'DEBUG',
                'handlers': ['console', ],
                'propagate': True,
            },
            'papermerge.core.routers.ws': {
                'level': 'DEBUG',
                'handlers': ['console', ],
                'propagate': True,
            },
            'papermerge.core.notif': {
                'level': 'DEBUG',
                'handlers': ['console', ],
                'propagate': True,
            },
        },
    }

search_engine = config.get('search', 'engine', default='xapian')
