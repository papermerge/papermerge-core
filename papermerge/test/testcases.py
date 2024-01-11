from django.test import TestCase as DjangoTestCase
from model_bakery import baker


class TestCase(DjangoTestCase):
    def setUp(self):
        super().setUp()

        self.user = baker.make('core.user')

    def tearDown(self):
        super().tearDown()
