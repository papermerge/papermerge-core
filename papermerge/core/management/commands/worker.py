import logging
import threading

from celery import Celery
from celery.apps.worker import Worker as CeleryWorker

from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)
celery_app = Celery('papermerge')


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

        logger.debug(
            f"CELERY_WORKER_HOSTNAME={settings.CELERY_WORKER_HOSTNAME}"
        )
        logger.debug(f"CELERY_WORKER_BEAT={settings.CELERY_WORKER_BEAT}")
        logger.debug(f"CELERY_WORKER_QUIET={settings.CELERY_WORKER_QUIET}")
        logger.debug(
            f"CELERY_WORKER_CONCURRENCY={settings.CELERY_WORKER_CONCURRENCY}"
        )

        celery_worker = CeleryWorker(
            hostname=settings.CELERY_WORKER_HOSTNAME,
            app=celery_app,
            beat=settings.CELERY_WORKER_BEAT,
            quiet=settings.CELERY_WORKER_QUIET,
            task_events=True,  # without this monitoring events won't work
            concurrency=settings.CELERY_WORKER_CONCURRENCY
        )

        # Set pidfile if it the corresponding argument has been provided
        if options['pidfile']:
            celery_worker.pidfile = options['pidfile']

        celery_worker.start()
