import importlib
import threading
from django.core.exceptions import ImproperlyConfigured


def import_class(path):
    path_bits = path.split(".")
    # Cut off the class name at the end.
    class_name = path_bits.pop()
    module_path = ".".join(path_bits)
    module_itself = importlib.import_module(module_path)

    if not hasattr(module_itself, class_name):
        raise ImportError(
            "The Python module '%s' has no '%s' class." % (
                module_path,
                class_name
            )
        )

    return getattr(module_itself, class_name)


# Load the search backend.
def load_backend(full_backend_path):
    """
    Loads a backend for interacting with the search engine.

    Requires a ``backend_path``. It should be a string resembling a Python
    import path, pointing to a ``BaseEngine`` subclass. The built-in options
    available are::

      * papermerge.search.backends.manticore.ManticoreEngine
      * papermerge.search.backend.elasticsearch.ElasticSearchEngine
      * papermerge.search.backend.postgresql.PostgreSQLEngine
    """
    path_bits = full_backend_path.split(".")

    if len(path_bits) < 2:
        raise ImproperlyConfigured(
            "The provided backend '%s' is not a complete Python path to a"
            "BaseEngine subclass."
            % full_backend_path
        )

    return import_class(full_backend_path)


class ConnectionHandler:

    def __init__(self, connections_info):
        self.connections_info = connections_info
        self.thread_local = threading.local()
        self._index = None

    @property
    def conn(self):
        self.thread_local.connection = load_backend(
            self.connections_info["ENGINE"]
        )()
        return self.thread_local.connection

    def reload(self, key):
        if not hasattr(self.thread_local, "connection"):
            self.thread_local.connection = None
        try:
            del self.thread_local.connection
        except KeyError:
            pass

        return self.conn


class UnifiedIndex:
    # Used to collect all the indexes into a cohesive whole.
    def __init__(self, excluded_indexes=None):
        self._indexes = {}
        self.fields = {}
        self._built = False
        self.excluded_indexes = excluded_indexes or []
        self.excluded_indexes_ids = {}
        self.document_field = "text"
        self._fieldnames = {}
        self._facet_fieldnames = {}
