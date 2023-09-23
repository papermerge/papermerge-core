from django.core.management.base import BaseCommand

from papermerge.core.models import User


class Command(BaseCommand):
    help = """
    List all users
    """

    def handle(self, *args, **options):
        if User.objects.count() == 0:
            self.stdout.write("No users in DB")
            return

        self.stdout.write("UUID\tusername\t")

        for user in User.objects.all():
            self.stdout.write(
                f"{user.id}\t{user.username}"
            )
