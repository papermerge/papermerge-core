from django.core.management.base import BaseCommand

from allauth.account.models import EmailAddress

from papermerge.core.models import User


class Command(BaseCommand):
    """
    As per allauth configurations - authentication can be configured
    to require email confirmation.
    Superuser however, is created using django's default command line utility
    ``createsuperuser``. Latter, is not aware of allauth 'mandatoryness' of
    the email field - let alone the confirmation part.
    As result, in case of mandatory email address confirmation -  superuser
    web login will always redirect in "confirmation sent".
    As workaround for such issue, this command is provided.
    User ``superuser`` command, you can:
        1. List superusers in the system.
        2. Confirm their email
    Notice that it us usual to create superuser without email address.
    Usage:
        $ ./manage.py superuser --list  # will list superuser(s)
        $ ./manage.py superuser --confirm -u admin --email admin@mail.com
    In case superuser ``admin`` does not have an email address, the email
    provided in command line, will be automatically asigned to him and then
    confirmed.
    """

    def add_arguments(self, parser):
        parser.add_argument(
            '-l',
            '--list',
            action='store_true',
            help="Lists superusers"
        )
        parser.add_argument(
            '-c',
            '--confirm',
            action='store_true',
            help="Confrim email address for given superuser"
        )
        parser.add_argument(
            '-u',
            '--username',
            help="Username of the user to confirm email for"
        )
        parser.add_argument(
            '-e',
            '--email',
            help="In case superuser does not have an email address "
            "this one will be assigned to him/her."
        )

    def handle(self, *args, **options):

        list_userusers = options.get('list', False)
        confirm = options.get('confirm', False)
        user = options.get('username', None)
        email = options.get('email', None)

        if list_userusers:
            self.list_superusers()
        elif confirm:
            self.confirm_email(user, email)

    def list_superusers(self):
        for u in User.objects.filter(is_superuser=True):
            _id = u.id
            _u = u.username
            _e = u.email
            _v = _has_verified_for_login(u)
            print(
                f"id={_id} username={_u} email={_e} verified={_v}"
            )

    def confirm_email(self, username: str, email: str):

        try:
            user = User.objects.get(
                username=username,
                is_superuser=True
            )
        except User.DoesNotExist:
            print(f"Superuser {username} was not found.")
            return

        if not (user.email or email):
            print(f"Please provide an email address.")

        if email:
            user.email = email
            user.save()

        user.confirm_email()


def _has_verified_for_login(user: User):

    email = user.email
    if email:
        ret = False
        try:
            emailaddress = EmailAddress.objects.get_for_user(user, email)
            ret = emailaddress.verified
        except EmailAddress.DoesNotExist:
            pass
    else:
        ret = EmailAddress.objects.filter(user=user, verified=True).exists()

    return ret
