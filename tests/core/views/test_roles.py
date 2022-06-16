from django.urls import reverse
from model_bakery import baker

from papermerge.test import TestCase, perms


class RolesViewPermissionsTestCase(TestCase):

    def test_view_roles_forbidden_for_default_user(self):
        """
        User without any permissions does not have access
        to 'role-list'
        """
        baker.make('role')
        response = self.client.get(reverse('role-list'))
        assert response.status_code == 403

    @perms('view_role')
    def test_view_roles_allowed_for_user_with_view_perm(self):
        """
        Access to 'role-list' is granted if user has 'view_role' permission
        """
        baker.make('role')
        response = self.client.get(reverse('role-list'))
        assert response.status_code == 200
