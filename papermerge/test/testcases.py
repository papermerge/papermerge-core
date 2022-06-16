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
