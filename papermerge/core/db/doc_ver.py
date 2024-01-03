from uuid import UUID

from sqlalchemy import Engine


def get_last_doc_ver_id(
    engine: Engine,
    doc_id: UUID  # noqa
) -> UUID:
    with engine.connect() as connection:  # noqa
        pass
