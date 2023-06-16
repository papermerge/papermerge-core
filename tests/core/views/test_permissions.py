import pytest
from django.urls import reverse

from papermerge.test import TestCase, perms


@pytest.mark.skip()
class PermissionsViewPermissionsTestCase(TestCase):
    """
    Assert that only user with 'view_permission' permission
    can list (almost) ALL permissions available in the system.
    In other words:

        GET /api/permissions/

    access is granted only to the users with 'view_permission' perm.
    """

    def test_view_all_system_permissions_forbidden_for_default_user(self):
        """
        User without 'view_permission' permission, user cannot list
        all permissions available in the system i.e.
        consume 'permission-list'
        """
        response = self.client.get(reverse('permission-list'))
        assert response.status_code == 403

    @perms('view_permission')
    def test_view_roles_allowed_for_user_with_view_perm(self):
        """
        Access to 'permission-list' is granted if user has
        view_permission' permission
        """
        response = self.client.get(reverse('permission-list'))
        assert response.status_code == 200
