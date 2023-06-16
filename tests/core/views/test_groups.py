import pytest
from django.urls import reverse
from model_bakery import baker

from papermerge.test import TestCase, perms


@pytest.mark.skip()
class GroupsViewPermissionsTestCase(TestCase):

    def test_view_groups_forbidden_for_default_user(self):
        """
        User without any permissions does not have access
        to 'group-list'
        """
        baker.make('group')
        response = self.client.get(reverse('group-list'))
        assert response.status_code == 403

    @perms('view_group')  # assign to currently logged in user 'view_group' perm
    def test_view_groups_allowed_for_user_with_view_perm(self):
        """
        Access to 'group-list' is granted if user has 'view_group' permission
        """
        baker.make('group')
        response = self.client.get(reverse('group-list'))
        assert response.status_code == 200
