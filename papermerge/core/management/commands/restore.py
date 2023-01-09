import logging

from django.core.management import BaseCommand
from papermerge.core.backup_restore import restore_documents2

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
        Restore all documents and their folder structure from tar archive
    """

    def add_arguments(self, parser):
        parser.add_argument('location', nargs='?', type=str)

    def handle(self, *args, **options):
        if location := options.get('location'):
            restore_documents2(file_path=location)
        else:
            logger.error("Please add the path to your backup.tar")
