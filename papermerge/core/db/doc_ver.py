from uuid import UUID

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db.models import Document, DocumentVersion


def get_last_doc_ver(
    engine: Engine,
    user_id: UUID,
    doc_id: UUID  # noqa
) -> schemas.DocumentVersion:
    """
    Returns last version of the document
    identified by doc_id
    """
    with Session(engine) as session:  # noqa
        stmt = select(DocumentVersion).join(Document).where(
            DocumentVersion.document_id == doc_id,
            Document.user_id == user_id
        ).order_by(
            DocumentVersion.number.desc()
        ).limit(1)
        db_doc_ver = session.scalars(stmt).one()
        model_doc_ver = schemas.DocumentVersion.model_validate(db_doc_ver)

    return model_doc_ver
