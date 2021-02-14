import time
import logging
from django.conf import settings
from django.core.management.base import BaseCommand
from papermerge.core.importers.imap import import_attachment


logger = logging.getLogger(__name__)


class Command(BaseCommand):

    help = """Import documents from email attachments.
"""

    def add_arguments(self, parser):
        parser.add_argument(
            "--loop-time",
            "-t",
            default=settings.PAPERMERGE_IMPORTER_LOOP_TIME,
            type=int,
            help="Wait time between each loop (in seconds)."
        )

    def main_loop(self, loop_time):
        while True:
            start_time = time.time()

            import_attachment(
                imap_server=self._imap_server,
                username=self._username,
                password=self._password,
                delete=self._delete,
                inbox_name=self._inbox_name,
                by_user=self._by_user,
                by_secret=self._by_secret
            )

            # Sleep until the start of the next loop step
            time.sleep(
                max(0, start_time + loop_time - time.time())
            )

    def handle(self, *args, **options):
        loop_time = options.get('loop_time')
        # options used by importer
        self._imap_server = settings.PAPERMERGE_IMPORT_MAIL_HOST
        self._username = settings.PAPERMERGE_IMPORT_MAIL_USER
        self._password = settings.PAPERMERGE_IMPORT_MAIL_PASS
        self._delete = settings.PAPERMERGE_IMPORT_MAIL_DELETE
        self._by_user = settings.PAPERMERGE_IMPORT_MAIL_BY_USER
        self._by_secret = settings.PAPERMERGE_IMPORT_MAIL_BY_SECRET
        self._inbox_name = settings.PAPERMERGE_IMPORT_MAIL_INBOX

        try:
            self.main_loop(loop_time)
        except KeyboardInterrupt:
            logger.info("Exiting")
