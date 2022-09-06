from django.db.backends.mysql.base import DatabaseWrapper  # noqa

from papermerge.search.backends import (
    BaseEngine,
    BaseSearchBackend,
    BaseSearchQuery
)


class ManticoreDatabaseWrapper(DatabaseWrapper):

    def check_settings(self):
        pass


class ManticoreSearchBackend(BaseSearchBackend):

    def __init__(self, **options):
        super().__init__(**options)
        self.connection = ManticoreDatabaseWrapper(settings_dict=options)

    def update(self, indexer, iterable, commit=True):
        pass

    def remove(self, obj, commit=True):
        pass

    def clear(self, models=None, commit=True):
        pass

    def search(self, query_string, **kwargs):
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT * FROM some_table")


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
