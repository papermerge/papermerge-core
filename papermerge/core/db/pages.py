from uuid import UUID

from sqlalchemy import Engine


def get_first_page_id(engine: Engine, doc_ver_id: UUID) -> UUID:
    with engine.connect() as connection:  # noqa
        pass
