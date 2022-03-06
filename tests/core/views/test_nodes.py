import json

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from papermerge.core.models import User, Folder


class NodesViewTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="user1")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_inboxcount_when_inbox_is_empty(self):
        """
        GET /nodes/inboxcount/ returns number of descendants of user's inbox
        folder.

        In this test user's inbox is empty.
        """
        response = self.client.get(reverse('inboxcount'))

        assert response.status_code == 200

        json_data = json.loads(response.content)
        # user's inbox is empty
        assert json_data == {'data': {'count': 0}}

    def test_get_inboxcount_with_one_item_in_inbox(self):
        """
        GET /nodes/inboxcount/ returns number of descendants of user's inbox
        folder.
        In this test user's inbox contains one single item (one folder).
        """
        Folder.objects.create(
            title='I am inside .inbox',
            user=self.user,
            parent=self.user.inbox_folder
        )
        response = self.client.get(reverse('inboxcount'))
        assert response.status_code == 200

        json_data = json.loads(response.content)
        # user's inbox contains one item
        assert json_data == {'data': {'count': 1}}
