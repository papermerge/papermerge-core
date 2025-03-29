import logging
import uuid


from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, aliased

from papermerge.core.schemas.common import PaginatedResponse
from papermerge.core import schema
from papermerge.core import constants as const
from papermerge.core import orm
from papermerge.core.tasks import send_task

from .orm import DocumentType

logger = logging.getLogger(__name__)


def get_document_types_without_pagination(
    db_session: Session,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> list[schema.DocumentType]:
    stmt_base = select(orm.DocumentType).order_by(orm.DocumentType.name.asc())

    if group_id:
        stmt = stmt_base.where(orm.DocumentType.group_id == group_id)
    elif user_id:
        stmt = stmt_base.where(orm.DocumentType.user_id == user_id)
    else:
        raise ValueError("Both: group_id and user_id are missing")

    db_document_types = db_session.scalars(stmt).all()
    items = [
        schema.DocumentType.model_validate(db_document_type)
        for db_document_type in db_document_types
    ]

    return items


ORDER_BY_MAP = {
    "name": orm.DocumentType.name.asc(),
    "-name": orm.DocumentType.name.desc(),
    "group_name": orm.Group.name.asc().nullsfirst(),
    "-group_name": orm.Group.name.desc().nullslast(),
}


def get_document_types(
    db_session: Session,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    filter: str | None = None,
    order_by: str = "name",
) -> schema.PaginatedResponse[schema.DocumentType]:

    UserGroupAlias = aliased(orm.user_groups_association)
    subquery = select(UserGroupAlias.c.group_id).where(
        UserGroupAlias.c.user_id == user_id
    )

    stmt_total_doc_types = select(func.count(DocumentType.id)).where(
        or_(
            orm.DocumentType.user_id == user_id, orm.DocumentType.group_id.in_(subquery)
        )
    )
    if filter:
        stmt_total_doc_types = stmt_total_doc_types.where(
            orm.DocumentType.name.icontains(filter)
        )
    total_doc_types = db_session.execute(stmt_total_doc_types).scalar()
    order_by_value = ORDER_BY_MAP.get(order_by, orm.DocumentType.name.asc())

    offset = page_size * (page_number - 1)

    stmt = (
        select(
            orm.DocumentType,
            orm.Group.name.label("group_name"),
            orm.Group.id.label("group_id"),
        )
        .join(orm.Group, orm.Group.id == orm.DocumentType.group_id, isouter=True)
        .where(
            or_(
                orm.DocumentType.user_id == user_id,
                orm.DocumentType.group_id.in_(subquery),
            )
        )
        .limit(page_size)
        .offset(offset)
        .order_by(order_by_value)
    )
    if filter:
        stmt = stmt.where(orm.DocumentType.name.icontains(filter))

    items = []

    for row in db_session.execute(stmt):
        kwargs = {
            "id": row.DocumentType.id,
            "name": row.DocumentType.name,
            "path_template": row.DocumentType.path_template,
            "custom_fields": row.DocumentType.custom_fields,
        }
        if row.group_name and row.group_id:
            kwargs["group_id"] = row.group_id
            kwargs["group_name"] = row.group_name

        items.append(schema.DocumentType(**kwargs))

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
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
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
        group_id=group_id,
    )
    session.add(dtype)
    session.commit()

    return dtype


def get_document_type(
    session: Session, document_type_id: uuid.UUID
) -> schema.DocumentType:
    stmt = (
        select(orm.DocumentType, orm.Group)
        .join(orm.Group, orm.Group.id == orm.DocumentType.group_id, isouter=True)
        .where(DocumentType.id == document_type_id)
    )
    row = session.execute(stmt).unique().one()
    kwargs = {
        "id": row.DocumentType.id,
        "name": row.DocumentType.name,
        "path_template": row.DocumentType.path_template,
        "custom_fields": row.DocumentType.custom_fields,
    }
    if row.Group and row.Group.id:
        kwargs["group_id"] = row.Group.id
        kwargs["group_name"] = row.Group.name

    result = schema.DocumentType(**kwargs)
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
) -> schema.DocumentType:
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    doc_type: DocumentType = session.execute(stmt).scalars().one()

    if attrs.custom_field_ids:
        stmt = select(orm.CustomField).where(
            orm.CustomField.id.in_(attrs.custom_field_ids)
        )
        custom_fields = session.execute(stmt).scalars().all()
        if attrs.custom_field_ids:
            doc_type.custom_fields = custom_fields

    if attrs.name:
        doc_type.name = attrs.name

    if attrs.group_id:
        doc_type.user_id = None
        doc_type.group_id = attrs.group_id
    elif attrs.user_id:
        doc_type.user_id = attrs.user_id
        doc_type.group_id = None
    else:
        raise ValueError(
            "Either attrs.user_id or attrs.group_id should be non-empty value"
        )

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
            kwargs={"document_type_id": str(document_type_id)},
            route_name="path_tmpl",
        )

    return result
