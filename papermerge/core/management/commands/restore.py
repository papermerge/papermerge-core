import logging

from django.core.management import BaseCommand
from papermerge.core.backup_restore import restore_data

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
        Restore all data from tar.tz archive
    """

    def add_arguments(self, parser):
        parser.add_argument('location', nargs='?', type=str)

    def handle(self, *args, **options):
        if location := options.get('location'):
            restore_data(file_path=location)
        else:
            logger.error("Please add the path to your backup.tar")
