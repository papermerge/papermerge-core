from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import User


class UsersViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_document_as_application_vnd_api_json(self):
        url = reverse('users-me')
        response = self.client.get(url, HTTP_ACCEPT='application/vnd.api+json')

        assert response.status_code == 200
