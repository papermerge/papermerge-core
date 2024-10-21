import logging
import uuid

from celery.app import default_app as celery_app
from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core import constants as const
from papermerge.core import schemas
from papermerge.core.db.models import CustomField

from .orm import DocumentType

logger = logging.getLogger(__name__)


def get_document_types(session: Session) -> list[schemas.DocumentType]:
    stmt = select(DocumentType)
    db_items = session.scalars(stmt).all()
    result = [schemas.DocumentType.model_validate(db_item) for db_item in db_items]

    return result


def document_type_cf_count(session: Session, document_type_id: uuid.UUID):
    """count number of custom fields associated to document type"""
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    dtype = session.scalars(stmt).one()
    return len(dtype.custom_fields)


def create_document_type(
    session: Session,
    name: str,
    user_id: uuid.UUID,
    custom_field_ids: list[uuid.UUID] | None = None,
    path_template: str | None = None,
) -> schemas.DocumentType:
    if custom_field_ids is None:
        cf_ids = []
    else:
        cf_ids = custom_field_ids

    stmt = select(CustomField).where(CustomField.id.in_(cf_ids))
    custom_fields = session.execute(stmt).scalars().all()
    dtype = DocumentType(
        id=uuid.uuid4(),
        name=name,
        custom_fields=custom_fields,
        path_template=path_template,
        user_id=user_id,
    )
    session.add(dtype)
    session.commit()
    result = schemas.DocumentType.model_validate(dtype)
    return result


def get_document_type(
    session: Session, document_type_id: uuid.UUID
) -> schemas.DocumentType:
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    db_item = session.scalars(stmt).unique().one()
    result = schemas.DocumentType.model_validate(db_item)
    return result


def delete_document_type(session: Session, document_type_id: uuid.UUID):
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    cfield = session.execute(stmt).scalars().one()
    session.delete(cfield)
    session.commit()


def update_document_type(
    session: Session, document_type_id: uuid.UUID, attrs: schemas.UpdateDocumentType
) -> schemas.DocumentType:
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    doc_type = session.execute(stmt).scalars().one()

    stmt = select(CustomField).where(CustomField.id.in_(attrs.custom_field_ids))
    custom_fields = session.execute(stmt).scalars().all()

    if attrs.name:
        doc_type.name = attrs.name

    if attrs.custom_field_ids:
        doc_type.custom_fields = custom_fields

    notify_path_tmpl_worker = False

    if doc_type.path_template != attrs.path_template:
        doc_type.path_template = attrs.path_template
        notify_path_tmpl_worker = True

    session.add(doc_type)
    session.commit()

    result = schemas.DocumentType.model_validate(doc_type)

    if notify_path_tmpl_worker:
        # background task to move all doc_type documents
        # to new target path based on path template evaluation
        celery_app.send_task(
            const.PATH_TMPL_MOVE_DOCUMENTS,
            kwargs={"document_type_id": str(document_type_id)},
            route_name="path_tmpl",
        )

    return result
