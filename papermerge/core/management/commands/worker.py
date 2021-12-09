import os
import logging
import threading

from celery import Celery
from celery import states
from celery.apps.worker import Worker as CeleryWorker

from django.core.management.base import BaseCommand
from papermerge.core.models import Document, BaseTreeNode

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


@celery_app.task
def rebuild_the_tree():
    # https://github.com/django-mptt/django-mptt/issues/568
    BaseTreeNode.objects.rebuild()


@celery_app.task
def txt2db():
    """
    Move OCRed text from txt files into database
    """
    logger.debug("Celery beat: txt2db")

    for doc in Document.objects.all():
        doc.update_text_field()


def _include_txt2db_task(celery_app_instance, schedule):
    # Calls every :schedule: seconds txt2db

    celery_app_instance.add_periodic_task(
        schedule,  # call this task once in :schedule: seconds
        txt2db.s(),
        name='txt2db'
    )


def _include_rebuid_tree_task(celery_app_instance, schedule):
    # once every :schedule: seconds rebuild the whole tree

    celery_app_instance.add_periodic_task(
        schedule,  # call this task once in :schedule: seconds
        rebuild_the_tree.s(),
        name='rebuild_the_tree'
    )


def setup_periodic_tasks(celery_app_instance, **options):
    """
    ``options`` will have following keys:
        * skip_txt2db :boolean:
        * skip_rebuid :boolean:

    Each of those keys decides weathe to start respective period task.
    Depending on setup, user might want to skip one, two or maybe all four
    period tasks.
    """

    start_txt2db = not options.get("skip_txt2db", False)
    start_rebuild = not options.get("skip_rebuild", False)
    rebuild_schedule = options.get("rebuild_schedule")
    txt2db_schedule = options.get("txt2db_schedule")


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

        parser.add_argument(
            '--skip-rebuild',
            action="store_true",
            help="Do not start 'rebuild_the_tree' periodic task."
        )
        parser.add_argument(
            '--rebuild-schedule',
            type=int,
            default=300,
            help="Schedule (in seconds) for 'rebuild_the_tree' periodic task."
            " Default value is 300 seconds."
        )
        parser.add_argument(
            '--skip-txt2db',
            action="store_true",
            help="Do not start 'txt2db' periodic task."
        )
        parser.add_argument(
            '--txt2db-schedule',
            type=int,
            default=64,
            help="Schedule (in seconds) for 'txt2db' periodic task."
            " Default value is 64 seconds."
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

        setup_periodic_tasks(
            celery_app_instance=celery_app,
            **options
        )
        setup_event_listening(celery_app)

        celery_worker.start()
