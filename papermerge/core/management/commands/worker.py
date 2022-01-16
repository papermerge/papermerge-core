import logging
import threading

from celery import Celery
from celery.apps.worker import Worker as CeleryWorker

from django.core.management.base import BaseCommand

from papermerge.core.task_monitor import (
    task_monitor,
    TASK_SENT,
    TASK_RECEIVED,
    TASK_STARTED,
    TASK_SUCCEEDED,
    TASK_FAILED
)

logger = logging.getLogger(__name__)
celery_app = Celery('papermerge')


def on_event(event):
    task_monitor.save_event(event)


def monitor_events(celery_app):

    with celery_app.connection() as conn:
        recv = celery_app.events.Receiver(
            conn,
            handlers={
                TASK_SENT: on_event,
                TASK_RECEIVED: on_event,
                TASK_STARTED: on_event,
                TASK_SUCCEEDED: on_event,
                TASK_FAILED: on_event,
            }
        )
        recv.capture(limit=None, timeout=None, wakeup=True)


def setup_event_listening(celery_app):
    thread = threading.Thread(target=monitor_events, args=[celery_app])
    thread.daemon = True
    thread.start()


class Command(BaseCommand):

    help = "Built-in Papermerge worker"

    def add_arguments(self, parser):
        parser.add_argument(
            '--pidfile',
            type=str,
            help='Optional file used to store the process pid.\n'
            'The program won’t start if this file already '
            'exists and the pid is still alive.'
        )

    def handle(self, *args, **options):
        celery_app.config_from_object(
            'django.conf:settings', namespace='CELERY'
        )
        # Load task modules from all registered Django app configs.
        celery_app.autodiscover_tasks()

        celery_worker = CeleryWorker(
            hostname="localhost",
            app=celery_app,
            beat=True,
            quiet=True,
            task_events=True,  # without this monitoring events won't work
            concurrency=1
        )

        # Set pidfile if it the corresponding argument has been provided
        if options['pidfile']:
            celery_worker.pidfile = options['pidfile']

        setup_event_listening(celery_app)

        celery_worker.start()
