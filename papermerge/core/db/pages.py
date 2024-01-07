from uuid import UUID

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import Page


def get_first_page(
    engine: Engine,
    user_id: UUID,
    doc_ver_id: UUID,
) -> schemas.Page:
    """
    Returns first page of the document version
    identified by doc_ver_id
    """
    with Session(engine) as session:  # noqa
        stmt = select(Page).where(
            document_version_id=doc_ver_id,
            user_id=user_id
        )
        db_page = session.scalars(stmt).one()
        db_model = schemas.Page.model_validate(db_page)

    return db_model
