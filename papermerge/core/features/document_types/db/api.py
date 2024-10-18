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


def document_type_cf_count(session: Session, document_type_id: uuid.UUID):
    """count number of custom fields associated to document type"""
    stmt = select(models.DocumentType).where(models.DocumentType.id == document_type_id)
    dtype = session.scalars(stmt).one()
    return len(dtype.custom_fields)


def create_document_type(
    session: Session,
    name: str,
    user_id: uuid.UUID,
    custom_field_ids: list[uuid.UUID] | None = None,
) -> schemas.DocumentType:
    if custom_field_ids is None:
        cf_ids = []
    else:
        cf_ids = custom_field_ids

    stmt = select(models.CustomField).where(models.CustomField.id.in_(cf_ids))
    custom_fields = session.execute(stmt).scalars().all()
    dtype = models.DocumentType(
        id=uuid.uuid4(),
        name=name,
        custom_fields=custom_fields,
        user_id=user_id,
    )
    session.add(dtype)
    session.commit()
    result = schemas.DocumentType.model_validate(dtype)
    return result


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

    stmt = select(models.CustomField).where(
        models.CustomField.id.in_(attrs.custom_field_ids)
    )
    custom_fields = session.execute(stmt).scalars().all()

    if attrs.name:
        doc_type.name = attrs.name

    if attrs.custom_field_ids:
        doc_type.custom_fields = custom_fields

    session.add(doc_type)
    session.commit()
    result = schemas.DocumentType.model_validate(doc_type)

    return result
