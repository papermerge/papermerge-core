import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = 'fake-key'
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
PAPERMERGE_CREATE_SPECIAL_FOLDERS = True

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

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

AUTH_USER_MODEL = "core.User"
