
from django.core.management.base import BaseCommand

from papermerge.core.models import User
from papermerge.core.utils import base64


class Command(BaseCommand):
    help = """
    List all users
    """

    def add_arguments(self, parser):
        parser.add_argument(
            'username'
        )

    def handle(self, *args, **options):
        user = User.objects.get(username=options.get('username'))
        data64 = base64.encode({"user_id": str(user.id)})
        self.stdout.write(f"blah.{data64}.blah")
