from celery import Celery
from celery.apps.worker import Worker as CeleryWorker

from django.core.management.base import BaseCommand


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

        celery_worker = CeleryWorker(
            app=celery_app,
            beat=False,
            quiet=True,
            concurrency=1
        )

        # Set pidfile if it the corresponding argument has been provided
        if options['pidfile']:
            celery_worker.pidfile = options['pidfile']

        celery_worker.start()
