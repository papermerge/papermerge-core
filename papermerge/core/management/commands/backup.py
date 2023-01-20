import logging
import datetime
import os

from django.core.management import BaseCommand

from papermerge.core.backup_restore import backup_data

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
        Backup all documents and their folder structure to an archive.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            'location',
            nargs='?',
            type=str,
            help="A directory or a file name (tar archive)."
            " If provided file is missing - will create one."
        )

    def handle(self, *args, **options):

        date_string = datetime.datetime.now().strftime("%d_%m_%Y-%H_%M_%S")
        default_filename = f"backup_{date_string}.tar.gz"

        location = options.get('location') or default_filename

        if os.path.isdir(location):
            # in case location is a non existing directory path e.g. "blah/"
            # os.path.isdir will return False
            file_path = os.path.join(location, default_filename)
        else:
            file_path = location

        try:
            backup_data(file_path=file_path)
        except IsADirectoryError:
            logger.error(
                "Provided location is a directory which does not exist."
                "Please create it first and try again."
            )
