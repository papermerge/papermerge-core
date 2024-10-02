import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db import models

logger = logging.getLogger(__name__)


def get_document_types(session: Session) -> list[schemas.DocumentType]:
    stmt = select(models.DocumentType)
    db_items = session.scalars(stmt).all()
    result = [schemas.DocumentType.model_validate(db_item) for db_item in db_items]

    return result


def create_document_type(
    session: Session,
    name: str,
    custom_fields_ids: list[str],
    user_id: uuid.UUID,
    extra_data: str | None = None,
) -> schemas.DocumentType:
    pass


def get_document_type(
    session: Session, document_type_id: uuid.UUID
) -> schemas.DocumentType:
    stmt = select(models.DocumentType).where(models.DocumentType.id == document_type_id)
    db_item = session.scalars(stmt).unique().one()
    result = schemas.DocumentType.model_validate(db_item)
    return result


def delete_document_type(session: Session, document_type_id: uuid.UUID):
    stmt = select(models.DocumentType).where(models.DocumentType.id == document_type_id)
    cfield = session.execute(stmt).scalars().one()
    session.delete(cfield)
    session.commit()


def update_document_type(
    session: Session, document_type_id: uuid.UUID, attrs: schemas.UpdateDocumentType
) -> schemas.DocumentType:
    stmt = select(models.DocumentType).where(models.DocumentType.id == document_type_id)
    doc_type = session.execute(stmt).scalars().one()
    session.add(doc_type)

    if attrs.name:
        doc_type.name = attrs.name

    session.commit()
    result = schemas.DocumentType.model_validate(doc_type)

    return result
