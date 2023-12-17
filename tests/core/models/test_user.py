from unittest.mock import patch

from django.contrib.auth.models import Permission
from model_bakery import baker

from papermerge.core.models import User
from papermerge.test import TestCase


def _perm(name):
    return Permission.objects.get(codename=name)


class TestUserModel(TestCase):

    def test_basic_user_create(self):
        User.objects.create(username='me')

    @patch('papermerge.core.signals.delete_user_data_task')
    def test_basic_user_create_and_delete(self, _):
        """
        Check that we can create/delete user without any nodes
        associated.
        """
        # create user
        user = baker.make('core.user')
        # make sure that deleting user without any nodes associated does not
        # raise any exception
        user.delete()

    @patch('papermerge.core.signals.delete_user_data_task')
    def test_user_can_be_deleted_even_if_he_has_associated_documents(self, _):
        """
        Makes sure that user model can be deleted if it has associated
        documents (i.e. user has some documents associated)
        """
        user = baker.make('core.user')
        baker.make('core.Document', user=user)
        user.delete()
