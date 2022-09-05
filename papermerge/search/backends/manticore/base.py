from django.db.backends.mysql import base  # noqa

from papermerge.search.backends import (
    BaseEngine,
    BaseSearchBackend,
    BaseSearchQuery
)


class ManticoreSearchBackend(BaseSearchBackend):
    def update(self, indexer, iterable, commit=True):
        pass

    def remove(self, obj, commit=True):
        pass

    def clear(self, models=None, commit=True):
        pass

    def search(self, query_string, **kwargs):
        pass


class ManticoreSearchQuery(BaseSearchQuery):

    def build_query(self):
        if not self.query_filter:
            return "*"

        return self._build_sub_query(self.query_filter)

    def _build_sub_query(self, search_node):
        term_list = []

        for child in search_node.children:
            value = child[1]
            term_list.append(value.prepare(self))

        return (" ").join(map(str, term_list))


class ManticoreEngine(BaseEngine):
    backend = ManticoreSearchBackend
    query = ManticoreSearchQuery
