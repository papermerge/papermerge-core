import pytest
from django.urls import reverse
from model_bakery import baker

from papermerge.core.schemas import User as PyUser
from papermerge.test import TestCase, perms
from papermerge.test.types import AuthTestClient


@pytest.mark.skip()
class UsersViewTest(TestCase):

    def test_get_document_as_application_vnd_api_json(self):
        url = reverse('users-me')
        response = self.client.get(url, HTTP_ACCEPT='application/vnd.api+json')

        assert response.status_code == 200

    @perms('change_user')
    def test_change_user_password(self):
        """
        POST /users/<uuid>/change-password/
        {'password': <password>}
        should change password of the user identified with <uuid>
        """
        user = baker.make('core.user')
        user.set_password('1234')
        assert user.check_password('1234')

        url = reverse('users-change-password', kwargs={'pk': user.id})

        response = self.post_json(url, {'password': 'abcd'})

        assert response.status_code == 200, response.content

        user.refresh_from_db()
        assert user.check_password('abcd')


@pytest.mark.skip()
class UsersViewPermissionsTestCase(TestCase):

    def test_view_users_forbidden_for_default_user(self):
        """
        User without any permissions does not have access
        to 'user-list'
        """
        baker.make('core.user')
        response = self.client.get(reverse('user-list'))
        assert response.status_code == 403

    def test_change_user_password_forbidden_without_perm(self):
        """
        'change_user' permission is required for changing password
        other users' password
        """
        user = baker.make('core.user')
        url = reverse('users-change-password', kwargs={'pk': user.id})

        response = self.post_json(url, {'password': 'abcd'})
        assert response.status_code == 403

    @perms('view_user')
    def test_view_users_allowed_for_user_with_view_perm(self):
        """
        Access to 'user-list' is granted if user has 'view_user' perm
        """
        baker.make('core.user')
        response = self.client.get(reverse('user-list'))
        assert response.status_code == 200


@pytest.mark.django_db(transaction=True)
def test_get_current_user(auth_api_client: AuthTestClient):
    """Check that /users/me returns a valid user (when authenticated)"""
    response = auth_api_client.get('/users/me')

    assert response.status_code == 200, response.content
    assert PyUser.model_validate(response.json())
