import logging
import uuid
from itertools import groupby

from sqlalchemy import select, func, or_
from sqlalchemy.orm import aliased, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.schemas.common import PaginatedResponse
from papermerge.core import schema
from papermerge.core import constants as const
from papermerge.core import orm
from papermerge.core.tasks import send_task
from papermerge.core.features.document_types import schema as dt_schema
from .orm import DocumentType

logger = logging.getLogger(__name__)


async def get_document_types_without_pagination(
    db_session: AsyncSession,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> list[schema.DocumentType]:
    stmt_base = select(DocumentType).options(
        selectinload(orm.DocumentType.custom_fields)
    ).order_by(DocumentType.name.asc())

    if group_id:
        stmt = stmt_base.where(DocumentType.group_id == group_id)
    elif user_id:
        stmt = stmt_base.where(DocumentType.user_id == user_id)
    else:
        raise ValueError("Both: group_id and user_id are missing")

    db_document_types = (await db_session.scalars(stmt)).all()
    items = [
        schema.DocumentType.model_validate(db_document_type)
        for db_document_type in db_document_types
    ]

    return items


async def get_document_types_grouped_by_owner_without_pagination(
    db_session: AsyncSession,
    user_id: uuid.UUID,
) -> list[dt_schema.GroupedDocumentType]:
    """
    Returns all document types to which user has access to, grouped
    by owner. Results are not paginated.
    """
    UserGroupAlias = aliased(orm.user_groups_association)
    subquery = select(UserGroupAlias.c.group_id).where(
        UserGroupAlias.c.user_id == user_id
    )
    stmt_base = (
        select(
            DocumentType.id,
            DocumentType.name,
            DocumentType.user_id,
            DocumentType.group_id,
            orm.Group.name.label("group_name"),
        )
        .select_from(DocumentType)
        .join(orm.Group, orm.Group.id == DocumentType.group_id, isouter=True)
        .order_by(
            DocumentType.user_id,
            DocumentType.group_id,
            DocumentType.name.asc(),
        )
    )

    stmt = stmt_base.where(
        or_(
            DocumentType.user_id == user_id,
            DocumentType.group_id.in_(subquery),
        )
    )

    db_document_types = await db_session.execute(stmt)

    def keyfunc(x):
        if x.user_id:
            return "My"

        return x.group_name

    results = []
    document_types = list(db_document_types)

    for key, group in groupby(document_types, keyfunc):
        group_items = []
        for item in group:
            group_items.append(
                dt_schema.GroupedDocumentTypeItem(name=item.name, id=item.id)
            )

        results.append(dt_schema.GroupedDocumentType(name=key, items=group_items))

    return results


async def get_document_types(
    db_session: AsyncSession,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    filter: str | None = None,
    order_by: str = "name",
) -> schema.PaginatedResponse[schema.DocumentType]:

    ORDER_BY_MAP = {
        "name": DocumentType.name.asc(),
        "-name": DocumentType.name.desc(),
        "group_name": orm.Group.name.asc().nullsfirst(),
        "-group_name": orm.Group.name.desc().nullslast(),
    }

    UserGroupAlias = aliased(orm.user_groups_association)
    subquery = select(UserGroupAlias.c.group_id).where(
        UserGroupAlias.c.user_id == user_id
    )

    stmt_total_doc_types = select(func.count(DocumentType.id)).where(
        or_(
            DocumentType.user_id == user_id, DocumentType.group_id.in_(subquery)
        )
    )
    if filter:
        stmt_total_doc_types = stmt_total_doc_types.where(
            DocumentType.name.icontains(filter)
        )
    total_doc_types = (await db_session.execute(stmt_total_doc_types)).scalar()
    order_by_value = ORDER_BY_MAP.get(order_by, DocumentType.name.asc())

    offset = page_size * (page_number - 1)

    stmt = (
        select(
            DocumentType,
            orm.Group.name.label("group_name"),
            orm.Group.id.label("group_id"),
        ).options(
            selectinload(orm.DocumentType.custom_fields)
        ).join(orm.Group, orm.Group.id == DocumentType.group_id, isouter=True)
        .where(
            or_(
                DocumentType.user_id == user_id,
                DocumentType.group_id.in_(subquery),
            )
        )
        .limit(page_size)
        .offset(offset)
        .order_by(order_by_value)
    )
    if filter:
        stmt = stmt.where(DocumentType.name.icontains(filter))

    items = []

    for row in await db_session.execute(stmt):
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


async def document_type_cf_count(session: AsyncSession, document_type_id: uuid.UUID):
    """count number of custom fields associated to document type"""
    stmt = select(DocumentType).options(
        selectinload(orm.DocumentType.custom_fields)
    ).where(DocumentType.id == document_type_id)
    dtype = (await session.scalars(stmt)).one()
    return len(dtype.custom_fields)


async def create_document_type(
    session: AsyncSession,
    name: str,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
    custom_field_ids: list[uuid.UUID] | None = None,
    path_template: str | None = None,
) -> DocumentType:
    if custom_field_ids is None:
        cf_ids = []
    else:
        cf_ids = custom_field_ids

    stmt = select(orm.CustomField).where(orm.CustomField.id.in_(cf_ids))
    custom_fields = (await session.execute(stmt)).scalars().all()
    dtype = DocumentType(
        id=uuid.uuid4(),
        name=name,
        custom_fields=custom_fields,
        path_template=path_template,
        user_id=user_id,
        group_id=group_id,
    )
    session.add(dtype)
    await session.commit()

    return dtype


async def get_document_type(
    session: AsyncSession, document_type_id: uuid.UUID
) -> schema.DocumentType:
    stmt = (
        select(DocumentType)
        .options(
            selectinload(DocumentType.custom_fields),
            selectinload(DocumentType.group)
        )
        .where(DocumentType.id == document_type_id)
    )

    result = await session.execute(stmt)
    document_type = result.scalar_one()

    kwargs = {
        "id": document_type.id,
        "name": document_type.name,
        "path_template": document_type.path_template,
        "custom_fields": document_type.custom_fields,
    }

    if document_type.group:
        kwargs["group_id"] = document_type.group.id
        kwargs["group_name"] = document_type.group.name

    return schema.DocumentType(**kwargs)


async def delete_document_type(session: AsyncSession, document_type_id: uuid.UUID):
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    cfield = (await session.execute(stmt)).scalars().one()
    await session.delete(cfield)
    await session.commit()


async def update_document_type(
    session: AsyncSession,
    document_type_id: uuid.UUID,
    attrs: schema.UpdateDocumentType,
) -> schema.DocumentType:
    stmt = select(DocumentType).where(DocumentType.id == document_type_id)
    doc_type: DocumentType = (await session.execute(stmt)).scalars().one()

    if attrs.custom_field_ids:
        stmt = select(orm.CustomField).where(
            orm.CustomField.id.in_(attrs.custom_field_ids)
        )
        custom_fields = (await session.execute(stmt)).scalars().all()
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
    await session.commit()

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
