from django.test import TestCase

from papermerge.search import connections
from papermerge.search.query import SQ


class ManticoreSearchQueryTestCase(TestCase):

    def setUp(self):
        super().setUp()
        conn = self.search_query = connections.conn
        self.search_query = conn.get_query()

    def test_build_query_all(self):
        assert self.search_query.build_query() == "*"

    def test_build_query_single_word(self):
        self.search_query.add_filter(SQ(content="hello"))
        assert self.search_query.build_query() == "hello"
