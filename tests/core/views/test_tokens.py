from django.urls import reverse
from model_bakery import baker

from papermerge.test import TestCase, perms


class AuthTokenViewPermissionsTestCase(TestCase):

    def test_authtokens_view_forbidden_for_default_user(self):
        response = self.client.get(reverse('token-list'))
        assert response.status_code == 403

    def test_authtoken_delete_forbidden_for_default_user(self):
        token = baker.make('authtoken')
        url = reverse('token-detail', kwargs={'pk': token.digest})
        response = self.client.delete(url)
        assert response.status_code == 403

    @perms('view_authtoken')
    def test_authtokens_view_allowed_for_user_with_view_perm(self):
        response = self.client.get(reverse('token-list'))
        assert response.status_code == 200

    @perms('delete_authtoken')
    def test_authtoken_delete_allowed_for_user_with_delete_perm(self):
        token = baker.make('authtoken')
        url = reverse('token-detail', kwargs={'pk': token.digest})

        response = self.client.delete(url)
        assert response.status_code == 204
