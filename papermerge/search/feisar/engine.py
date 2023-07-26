import xapian

from .utils import get_db_path


class Engine:

    def __init__(self, dsn: str):
        self._dsn = dsn
        self._db_path = get_db_path(dsn)
        self._db = xapian.WritableDatabase(
            self._db_path,
            xapian.DB_CREATE_OR_OPEN
        )
        # self._termgen = xapian.TermGenerator()
        # self._termgen.set_stemmer(xapian.Stem('en'))


def create_engine(dsn: str):
    return Engine(dsn)
