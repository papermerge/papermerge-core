from django.utils.asyncio import async_unsafe
from django.db.backends.mysql.base import DatabaseWrapper  # noqa
from django.db.backends.signals import connection_created
from django.utils.functional import cached_property

from papermerge.search.backends import (
    SearchNode,
    BaseEngine,
    BaseSearchBackend,
    BaseSearchQuery
)
from papermerge.search.inputs import PythonData


class ManticoreDatabaseWrapper(DatabaseWrapper):

    def get_connection_params(self):
        kwargs = {
            'host': '127.0.0.1',
            'port': 9306
        }
        return kwargs

    def check_settings(self):
        pass

    def init_connection_state(self):
        pass

    @async_unsafe
    def connect(self):
        """Connect to the database. Assume that the connection is closed."""
        # Check for invalid configurations.
        self.check_settings()
        # In case the previous connection was closed while in an atomic block
        self.in_atomic_block = False
        self.savepoint_ids = []
        self.needs_rollback = False
        # Reset parameters defining when to close the connection
        self.close_at = None
        self.closed_in_transaction = False
        self.errors_occurred = False
        # Establish the connection
        conn_params = self.get_connection_params()
        self.connection = self.get_new_connection(conn_params)
        # self.set_autocommit(self.settings_dict["AUTOCOMMIT"])
        self.init_connection_state()
        connection_created.send(sender=self.__class__, connection=self)

    @cached_property
    def mysql_server_data(self):
        return {
            "version": "5.0.0",
            "sql_mode": False,
            "default_storage_engine": False,
            "sql_auto_is_null": False,
            "lower_case_table_names": False,
            "has_zoneinfo_database": False,
        }

    @cached_property
    def mysql_server_info(self):
        return self.mysql_server_data["version"]


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
        pass
        # with self.connection.cursor() as cursor:
        #    cursor.execute("SELECT * FROM some_table")


class ManticoreSearchQuery(BaseSearchQuery):

    def build_query(self):
        if not self.query_filter:
            return "*"

        return self._build_sub_query(self.query_filter)

    def _build_sub_query(self, search_node):
        term_list = []

        for child in search_node.children:
            if isinstance(child, SearchNode):
                term_list.append(self._build_sub_query(child))
            else:
                value = child[1]

                if not hasattr(value, "input_type_name"):
                    value = PythonData(value)

                term_list.append(value.prepare(self))

        return (" ").join(map(str, term_list))


class ManticoreEngine(BaseEngine):
    backend = ManticoreSearchBackend
    query = ManticoreSearchQuery
