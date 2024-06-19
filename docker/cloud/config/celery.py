import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
PREFIX = os.environ.get('PAPERMERGE__MAIN__PREFIX', None)

app = Celery('papermerge')

# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Workaround celery's bug:
# https://github.com/celery/celery/issues/4296
# Without this options, if broker is down, the celery
# will loop forever in apply_async.
app.conf.broker_transport_options = {
    'max_retries': 3,
    'interval_start': 0,
    'interval_step': 0.2,
    'interval_max': 0.2,
}


def prefixed(name: str) -> str:
    if PREFIX:
        return f'{PREFIX}_{name}'

    return name


app.conf.task_routes = {
    # `s3_worker`: uploads/downloads of document version files
    # via s3 queue
    's3': {'queue': prefixed('s3')},
    # `s3_worker`: generates previews and uploads them to s3 storage
    # via s3preview queue
    's3preview': {'queue': prefixed('s3preview')},
    # index worker - sends index add/remove/updates
    'i3': {'queue': prefixed('i3')},
    'ocr': {'queue': prefixed('ocr')}
}
