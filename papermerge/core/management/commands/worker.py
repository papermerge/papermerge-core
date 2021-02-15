import os
import logging

from celery import Celery
from celery.apps.worker import Worker as CeleryWorker
from django.core.management.base import BaseCommand
from django.conf import settings
from papermerge.core.models import Document, BaseTreeNode
from papermerge.core.importers.imap import import_attachment
from papermerge.core.importers.local import import_documents

logger = logging.getLogger(__name__)
celery_app = Celery('papermerge')


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


@celery_app.task
def import_from_email():
    """
    Import attachments from specified email account.
    """
    # if no email import defined, just skip the whole
    # thing.
    if not settings.PAPERMERGE_IMPORT_MAIL_USER:
        return

    logger.debug("Celery beat: import_from_email")

    imap_server = settings.PAPERMERGE_IMPORT_MAIL_HOST
    username = settings.PAPERMERGE_IMPORT_MAIL_USER
    password = settings.PAPERMERGE_IMPORT_MAIL_PASS
    delete = settings.PAPERMERGE_IMPORT_MAIL_DELETE
    by_user = settings.PAPERMERGE_IMPORT_MAIL_BY_USER
    by_secret = settings.PAPERMERGE_IMPORT_MAIL_BY_SECRET
    inbox_name = settings.PAPERMERGE_IMPORT_MAIL_INBOX

    import_attachment(
        imap_server=imap_server,
        username=username,
        password=password,
        delete=delete,
        inbox_name=inbox_name,
        by_user=by_user,
        by_secret=by_secret
    )


@celery_app.task
def import_from_local_folder():
    """
    Import documents from defined local folder
    """
    logger.debug("Celery beat: import_from_local_folder")
    import_documents(settings.PAPERMERGE_IMPORTER_DIR)


def _include_txt2db_task(celery_app_instance):
    # Calls every 64 seconds txt2db
    celery_app_instance.add_periodic_task(
        64.0, txt2db.s(), name='txt2db'
    )


def _include_rebuid_tree_task(celery_app_instance):
    # once every 5 minutes rebuild the whole tree
    celery_app_instance.add_periodic_task(
        300, rebuild_the_tree.s(), name='rebuild_the_tree'
    )


def _include_local_dir_task(celery_app_instance):
    imp_dir_exists = None
    imp_dir = settings.PAPERMERGE_IMPORTER_DIR
    if settings.PAPERMERGE_IMPORTER_DIR:
        imp_dir_exists = os.path.exists(settings.PAPERMERGE_IMPORTER_DIR)

    if imp_dir and imp_dir_exists:
        celery_app_instance.add_periodic_task(
            30.0,
            import_from_local_folder.s(),
            name='import_from_local_folder'
        )
    else:
        reason_msg = ""

        if not imp_dir:
            reason_msg += "1. IMPORTER_DIR not configured\n"
        if not imp_dir_exists:
            reason_msg += "2. importer dir does not exist\n"

        logger.warning(
            "Importer from local folder task not started."
            "Reason:\n" + reason_msg
        )


def _include_imap_import_task(celery_app_instance):
    mail_user = settings.PAPERMERGE_IMPORT_MAIL_USER
    mail_host = settings.PAPERMERGE_IMPORT_MAIL_HOST

    if mail_user and mail_host:
        celery_app_instance.add_periodic_task(
            30.0, import_from_email.s(), name='import_from_email'
        )
    else:
        reason_msg = ""
        if not mail_user:
            reason_msg += "PAPERMERGE_IMPORT_MAIL_USER not defined\n"
        if not mail_host:
            reason_msg += "PAPERMERGE_IMPORT_MAIL_HOST not defined\n"

        logger.warning(
            "Importer from imap account not started."
            "Reason:\n" + reason_msg
        )


def setup_periodic_tasks(celery_app_instance, **options):
    """
    ``options`` will have following keys:

        * skip_imap :boolean:
        * skip_local :boolean:
        * skip_txt2db :boolean:
        * skip_rebuid :boolean:

    Each of those keys decides weathe to start respective period task.
    Depending on setup, user might want to skip one, two or maybe all four
    period tasks.
    """

    # if user provides --skip-imap flag i.e.
    #
    #   $ ./manage.py worker --skip-imap
    #
    # then
    #   1. options.get('skip_imap') is True
    #   2. not options.get('skip_imap') is False
    #   3. start_imap_import = False
    start_imap_import = not options.get("skip_imap", False)
    start_local_import = not options.get("skip_local", False)
    start_txt2db = not options.get("skip_txt2db", False)
    start_rebuild = not options.get("skip_rebuild", False)

    if start_txt2db:
        _include_txt2db_task(celery_app_instance)

    if start_rebuild:
        _include_rebuid_tree_task(celery_app_instance)

    if start_local_import:
        _include_local_dir_task(celery_app_instance)

    if start_imap_import:
        _include_imap_import_task(celery_app_instance)


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
            '--skip-imap',
            action="store_true",
            help="Skip IMAP importing part. "
            "With this flag option present, worker won't "
            "start period task for fetching attachments from "
            "IMAP account."
        )
        parser.add_argument(
            '--skip-local',
            action="store_true",
            help="Skip local directory importing part. "
            "With this flag option present, worker won't "
            "start period task for ingesting documents from "
            "local folder."
        )
        parser.add_argument(
            '--skip-rebuild',
            action="store_true",
            help="Do not start 'rebuild_the_tree' periodic task."
        )
        parser.add_argument(
            '--skip-txt2db',
            action="store_true",
            help="Do not start 'txt2db' periodic task."
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
            concurrency=1
        )

        # Set pidfile if it the corresponding argument has been provided
        if options['pidfile']:
            celery_worker.pidfile = options['pidfile']

        setup_periodic_tasks(
            celery_app_instance=celery_app,
            **options
        )

        celery_worker.start()
