from papermerge.core.models import User
from papermerge.test import TestCase
from model_bakery import baker


class TestUserModel(TestCase):

    def test_basic_user_create(self):
        User.objects.create(username='me')

    def test_basic_user_create_and_delete(self):
        """
        Check that we can create/delete user without any nodes
        associated.
        """
        # create user
        user = baker.make('core.user')
        # make sure that deleting user without any nodes associated does not
        # raise any exception
        user.delete()
