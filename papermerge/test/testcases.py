import json

from django.test import TestCase as DjangoTestCase
from rest_framework.test import APIClient
from model_bakery import baker


class TestCase(DjangoTestCase):
    def setUp(self):
        super().setUp()

        self.user = baker.make('core.user')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        super().tearDown()
        self.client.logout()

    def post_json(self, url, data):
        return self.client.post(
            url,
            json.dumps(data),
            content_type='application/json'
        )

    def post(self, url, data, type="json"):
        if type == "json":
            content_type = "application/json"
        else:
            content_type = "application/vnd.api+json"

        return self.client.post(
            url,
            json.dumps(data),
            content_type=content_type
        )
