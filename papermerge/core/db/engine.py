import logging
import os

import django
from django.conf import settings
from sqlalchemy import Engine, create_engine
from sqlalchemy.pool import NullPool

SQLALCHEMY_DATABASE_URL = os.environ.get(
    'PAPERMERGE__DATABASE__URL',
    'sqlite:////db/db.sqlite3'
)
connect_args = {}
logger = logging.getLogger(__name__)

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

if getattr(settings, 'TESTING', False):
    # If we are in testing runtime
    # then use same db as django tests, i.e. use same as:
    # DATABASES = { # Django's DATABASES config
    #    'default': {
    #        'ENGINE': 'django.db.backends.sqlite3',
    #        'TEST': {
    #            'NAME': TEST_ROOT / 'test.db'
    #        }
    #    }
    # }
    SQLALCHEMY_DATABASE_URL = f'sqlite:///{settings.TEST_ROOT}/test.db'


if SQLALCHEMY_DATABASE_URL.startswith('sqlite'):
    # sqlite specific connection args
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    poolclass=NullPool
)


def get_engine() -> Engine:
    return engine
