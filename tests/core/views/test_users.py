from django.urls import reverse
from model_bakery import baker

from papermerge.test import TestCase, perms


class UsersViewTest(TestCase):

    def test_get_document_as_application_vnd_api_json(self):
        url = reverse('users-me')
        response = self.client.get(url, HTTP_ACCEPT='application/vnd.api+json')

        assert response.status_code == 200


class UsersViewPermissionsTestCase(TestCase):

    def test_view_users_forbidden_for_default_user(self):
        """
        User without any permissions does not have access
        to 'user-list'
        """
        baker.make('core.user')
        response = self.client.get(reverse('user-list'))
        assert response.status_code == 403

    @perms('view_user')
    def test_view_users_allowed_for_user_with_view_perm(self):
        """
        Access to 'user-list' is granted if user has 'view_user' perm
        """
        baker.make('core.user')
        response = self.client.get(reverse('user-list'))
        assert response.status_code == 200
