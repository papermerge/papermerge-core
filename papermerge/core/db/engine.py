import os

from django.conf import settings
from sqlalchemy import Engine, create_engine
from sqlalchemy.pool import NullPool

SQLALCHEMY_DATABASE_URL = os.environ.get(
    'PAPERMERGE__DATABASE__URL',
    'sqlite:////db/db.sqlite3'
)
connect_args = {}

if getattr(settings, 'TESTING', False):
    #  i.e. we are in running tests mode
    # then use same DATABASE as django tests:
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
