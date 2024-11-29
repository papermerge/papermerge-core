import logging
import uuid


from sqlalchemy import select, func
from sqlalchemy.orm import Session

from papermerge.core.schemas.common import PaginatedResponse
from papermerge.core import schema
from papermerge.core import constants as const
from papermerge.core import orm
from papermerge.core.tasks import send_task

from .orm import DocumentType

logger = logging.getLogger(__name__)


def get_document_types_without_pagination(
    db_session: Session, user_id: uuid.UUID
) -> list[schema.DocumentType]:
    stmt = select(orm.DocumentType).where(orm.DocumentType.user_id == user_id)

    db_document_types = db_session.scalars(stmt).all()
    items = [
        schema.DocumentType.model_validate(db_document_type)
        for db_document_type in db_document_types
    ]

    return items


def get_document_types(
    session: Session, user_id: uuid.UUID, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.DocumentType]:

    stmt_total_doc_types = select(func.count(DocumentType.id)).where(
        DocumentType.user_id == user_id
    )
    total_doc_types = session.execute(stmt_total_doc_types).scalar()

    offset = page_size * (page_number - 1)
    stmt = (
        select(DocumentType)
        .where(DocumentType.user_id == user_id)
        .limit(page_size)
        .offset(offset)
    )
    db_items = session.scalars(stmt).all()
    items = [schema.DocumentType.model_validate(db_item) for db_item in db_items]

    total_pages = int(total_doc_types / page_size) + 1

    return PaginatedResponse(
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


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
) -> orm.DocumentType:
    if custom_field_ids is None:
        cf_ids = []
    else:
        cf_ids = custom_field_ids

    stmt = select(orm.CustomField).where(orm.CustomField.id.in_(cf_ids))
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

    return dtype


def get_document_type(
    session: Session, document_type_id: uuid.UUID
) -> schema.DocumentType:
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    db_item = session.scalars(stmt).unique().one()
    result = schema.DocumentType.model_validate(db_item)
    return result


def delete_document_type(session: Session, document_type_id: uuid.UUID):
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    cfield = session.execute(stmt).scalars().one()
    session.delete(cfield)
    session.commit()


def update_document_type(
    session: Session,
    document_type_id: uuid.UUID,
    attrs: schema.UpdateDocumentType,
    user_id: uuid.UUID,
) -> schema.DocumentType:
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    doc_type = session.execute(stmt).scalars().one()

    stmt = select(orm.CustomField).where(orm.CustomField.id.in_(attrs.custom_field_ids))
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

    result = schema.DocumentType.model_validate(doc_type)

    if notify_path_tmpl_worker:
        # background task to move all doc_type documents
        # to new target path based on path template evaluation
        send_task(
            const.PATH_TMPL_MOVE_DOCUMENTS,
            kwargs={"document_type_id": str(document_type_id), "user_id": str(user_id)},
            route_name="path_tmpl",
        )

    return result
