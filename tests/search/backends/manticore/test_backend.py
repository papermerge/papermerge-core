from django.test import TestCase
from papermerge.search import connections
from papermerge.core.models import User


class TestManticoreBackendTest(TestCase):

    def test_search(self):
        User.objects.create_user(username='abc', password='abc')
        User.objects.filter(username__contains='xyz').first()
        search_backend = connections.conn.get_backend()
        search_backend.search("")
