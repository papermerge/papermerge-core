from uuid import UUID

from sqlalchemy import Engine, exc, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import Page

from .exceptions import PageNotFound


def get_first_page(
    engine: Engine,
    doc_ver_id: UUID,
) -> schemas.Page:
    """
    Returns first page of the document version
    identified by doc_ver_id
    """
    with Session(engine) as session:  # noqa
        stmt = select(Page).where(
            Page.document_version_id == doc_ver_id,
        ).order_by(
            Page.number.asc()
        ).limit(1)
        try:
            db_page = session.scalars(stmt).one()
        except exc.NoResultFound:
            session.close()
            raise PageNotFound(
                f"DocVerID={doc_ver_id} does not have pages."
                " Maybe it does not have associated file yet?"
            )
        model = schemas.Page.model_validate(db_page)

    return model
