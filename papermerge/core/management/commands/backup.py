import logging
import datetime
import os

from django.core.management import BaseCommand

from papermerge.core.backup_restore.backup import backup_documents
from papermerge.core.models import User

logger = logging.getLogger(__name__)


def list_users_and_exit():
    print("id\tusername\temail")
    print("----------------------------------")
    for user in User.objects.all():
        print(f"{user.id}\t{user.username}\t{user.email}")

    return True


class Command(BaseCommand):
    help = """
        Backup all documents and their folder structure to an archive.
        If --user/-u is specified - will backup all documents of
        the specific user.

        If --user/u is NOT specified - will backup documents of all users.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            'location',
            nargs='?',
            type=str,
            help="A directory or a file name (tar archive)."
            " If provided file is missing - will create one."
        )
        # Papermerge is multi-user system. There may be different users
        # with diferent folder structure each. Perform backup on specified one.
        parser.add_argument(
            "-u",
            "--user",
            help="""
            username of the user to perform backup for. If not given
            will perform backup for all users.
            """
        )
        parser.add_argument(
            "-l",
            "--list-users",
            action='store_true',
            help="List exiting users and quit."
        )

    def handle(self, *args, **options):

        date_string = datetime.datetime.now().strftime("%d_%m_%Y-%H_%M_%S")
        default_filename = f"backup_{date_string}.tar.gz"

        username = options.get('user')
        location = options.get('location') or default_filename

        if options.get('list_users'):
            list_users_and_exit()
            return

        user = None
        if username:
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                logger.error(
                    f"Username {username} not found."
                )
                return

        # consider the case when user provides directory location i.e.
        # ./manage.py backup /backup/papermerge/

        if os.path.isdir(location):
            # in case location is a non existing directory path e.g. "blah/"
            # os.path.isdir will return False
            file_path = os.path.join(location, default_filename)
        else:
            file_path = location

        try:
            backup_documents(
                file_path=file_path,
                user=user
            )
        except IsADirectoryError:
            logger.error(
                "Provided location is a directory which does not exist."
                "Please create it first and try again."
            )
