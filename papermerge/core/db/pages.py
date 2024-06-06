from uuid import UUID

from sqlalchemy import Engine, exc, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import Document, DocumentVersion, Page

from .exceptions import PageNotFound


def get_first_page(
    db_session: Session,
    doc_ver_id: UUID,
) -> schemas.Page:
    """
    Returns first page of the document version
    identified by doc_ver_id
    """
    with db_session as session:  # noqa
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


def get_page(
    engine: Engine,
    id: UUID,
    user_id: UUID
) -> schemas.Page:
    with Session(engine) as session:  # noqa
        stmt = select(Page).join(DocumentVersion).join(Document).where(
            Page.id == id,
            Document.user_id == user_id
        )
        try:
            db_page = session.scalars(stmt).one()
        except exc.NoResultFound:
            session.close()
            raise PageNotFound(
                f"PageID={id} not found"
            )
        model = schemas.Page.model_validate(db_page)

    return model


def get_doc_ver_pages(
    db_session: Session,
    doc_ver_id: UUID
) -> list[schemas.Page]:
    with db_session as session:
        stmt = select(Page).where(
            Page.document_version_id == doc_ver_id
        ).order_by('number')
        try:
            db_pages = session.scalars(stmt).all()
        except exc.NoResultFound:
            session.close()
            raise PageNotFound(
                f"No pages not found for doc_ver_id={doc_ver_id}"
            )
        models = [
            schemas.Page.model_validate(db_page)
            for db_page in db_pages
        ]

    return models
