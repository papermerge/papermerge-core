from uuid import UUID

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core.features.document.db.orm import Document, DocumentVersion
from papermerge.core.features.document import schema as doc_schema


def get_last_doc_ver(
    db_session: Session,
    user_id: UUID,
    doc_id: UUID,  # noqa
) -> doc_schema.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """
    with db_session as session:  # noqa
        stmt = (
            select(DocumentVersion)
            .join(Document)
            .where(DocumentVersion.document_id == doc_id, Document.user_id == user_id)
            .order_by(DocumentVersion.number.desc())
            .limit(1)
        )
        db_doc_ver = session.scalars(stmt).one()
        model_doc_ver = doc_schema.DocumentVersion.model_validate(db_doc_ver)

    return model_doc_ver


def get_doc_ver(
    engine: Engine,
    id: UUID,
    user_id: UUID,  # noqa
) -> doc_schema.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """
    with Session(engine) as session:  # noqa
        stmt = (
            select(DocumentVersion)
            .join(Document)
            .where(Document.user_id == user_id, DocumentVersion.id == id)
        )
        db_doc_ver = session.scalars(stmt).one()
        model_doc_ver = doc_schema.DocumentVersion.model_validate(db_doc_ver)

    return model_doc_ver
