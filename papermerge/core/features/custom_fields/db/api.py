import math
import logging
import uuid

from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session


from papermerge.core import schema, orm


logger = logging.getLogger(__name__)


ORDER_BY_MAP = {
    "type": orm.CustomField.type.asc(),
    "-type": orm.CustomField.type.desc(),
    "name": orm.CustomField.name.asc(),
    "-name": orm.CustomField.name.desc(),
}


def get_custom_fields(
    db_session: Session,
    *,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    filter: str,
    order_by: str = "name",
) -> schema.PaginatedResponse[schema.CustomField]:
    stmt_total_cf = select(func.count(orm.CustomField.id)).where(
        orm.CustomField.user_id == user_id
    )
    if filter:
        stmt_total_cf = stmt_total_cf.where(
            or_(
                orm.CustomField.name.icontains(filter),
                orm.CustomField.type.icontains(filter),
            )
        )

    total_cf = db_session.execute(stmt_total_cf).scalar()
    order_by_value = ORDER_BY_MAP.get(order_by, orm.CustomField.name.asc())

    offset = page_size * (page_number - 1)
    stmt = (
        select(orm.CustomField)
        .where(orm.CustomField.user_id == user_id)
        .limit(page_size)
        .offset(offset)
        .order_by(order_by_value)
    )

    if filter:
        stmt = stmt.where(
            or_(
                orm.CustomField.name.icontains(filter),
                orm.CustomField.type.icontains(filter),
            )
        )

    db_cfs = db_session.scalars(stmt).all()
    items = [schema.CustomField.model_validate(db_cf) for db_cf in db_cfs]

    total_pages = math.ceil(total_cf / page_size)

    return schema.PaginatedResponse[schema.CustomField](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


def get_custom_fields_without_pagination(
    db_session: Session,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> list[schema.CustomField]:
    stmt_base = select(orm.CustomField).order_by(orm.CustomField.name.asc())

    if group_id:
        stmt = stmt_base.where(orm.CustomField.group_id == group_id)
    elif user_id:
        stmt = stmt_base.where(orm.CustomField.user_id == user_id)
    else:
        raise ValueError("Both: group_id and user_id are missing")

    db_cfs = db_session.scalars(stmt).all()
    items = [schema.CustomField.model_validate(db_cf) for db_cf in db_cfs]

    return items


def create_custom_field(
    session: Session,
    name: str,
    type: schema.CustomFieldType,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
    extra_data: str | None = None,
) -> schema.CustomField:
    cfield = None

    if user_id:
        cfield = orm.CustomField(
            id=uuid.uuid4(),
            name=name,
            type=type,
            extra_data=extra_data,
            user_id=user_id,
        )
    elif group_id:
        cfield = orm.CustomField(
            id=uuid.uuid4(),
            name=name,
            type=type,
            extra_data=extra_data,
            group_id=group_id,
        )

    session.add(cfield)
    session.commit()
    result = schema.CustomField.model_validate(cfield)

    return result


def get_custom_field(
    session: Session, custom_field_id: uuid.UUID
) -> schema.CustomField:
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    db_item = session.scalars(stmt).unique().one()
    result = schema.CustomField.model_validate(db_item)
    return result


def delete_custom_field(session: Session, custom_field_id: uuid.UUID):
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.delete(cfield)
    session.commit()


def update_custom_field(
    session: Session, custom_field_id: uuid.UUID, attrs: schema.UpdateCustomField
) -> schema.CustomField:
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.add(cfield)

    if attrs.name:
        cfield.name = attrs.name

    if attrs.type:
        cfield.type = attrs.type

    if attrs.extra_data:
        cfield.extra_data = attrs.extra_data

    if attrs.user_id:
        cfield.user_id = attrs.user_id
        cfield.group_id = None

    if attrs.group_id:
        cfield.user_id = None
        cfield.group_id = attrs.group_id

    session.commit()
    result = schema.CustomField.model_validate(cfield)

    return result
