from django.test import TestCase
from papermerge.search import connections


class TestManticoreBackendTest(TestCase):

    def test_search(self):
        search_backend = connections.conn.get_backend()
        assert search_backend.search("") == {"hits": 0, "results": []}
