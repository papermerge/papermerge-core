from django.contrib.auth.models import Permission

from papermerge.core.models import User
from papermerge.test import TestCase
from model_bakery import baker


def _perm(name):
    return Permission.objects.get(codename=name)


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

    def test_user_perm_codenames_attr(self):
        """
        Assert that ``user.perm_codenames`` attribute
        returns a list all permissions' user has i.e. the total of permissions
        gathered via groups and via own user object
        """
        user = baker.make('core.user')
        gr1 = baker.make('group')
        gr2 = baker.make('group')
        gr1.permissions.add(_perm('view_user'))
        gr2.permissions.add(_perm('view_group'))
        user.groups.add(gr1, gr2)

        expected_perms = set(['view_user', 'view_group'])
        # this is the attribute we are actually testing
        actual_perms = set(user.perm_codenames)

        assert expected_perms == actual_perms

    def test_user_perm_codenames_default(self):
        """
        When no direct permissions are assigned to the user
        or no groups associated (with perms), then `user.perm_codenames`
        returns an empty list.
        """
        user = baker.make('core.user')
        assert user.perm_codenames == []

    def test_user_perm_codenames_from_different_sources(self):
        user = baker.make('core.user')
        # permissions via group
        gr = baker.make('group')
        gr.permissions.add(_perm('view_user'), _perm('add_user'))
        user.groups.add(gr)

        # permissions directly associated to the user
        user.user_permissions.add(_perm('view_group'), _perm('add_group'))

        expected_perms = set(
            ['view_user', 'view_group', 'add_group', 'add_user']
        )
        # this is the attribute we are actually testing
        actual_perms = set(user.perm_codenames)

        assert expected_perms == actual_perms

    def test_user_can_be_deleted_even_if_he_has_associated_documents(self):
        """
        Makes sure that user model can be deleted if it has associated
        documents (i.e. user has some documents associated)
        """
        user = baker.make('core.user')
        baker.make('core.Document', user=user)
        user.delete()
