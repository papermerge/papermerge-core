import math
import logging
import uuid

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from papermerge.core import schema, orm


logger = logging.getLogger(__name__)


def get_custom_fields(
    db_session: Session, *, user_id: uuid.UUID, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.CustomField]:
    stmt_total_cf = select(func.count(orm.CustomField.id)).where(
        orm.CustomField.user_id == user_id
    )
    total_cf = db_session.execute(stmt_total_cf).scalar()

    offset = page_size * (page_number - 1)
    stmt = (
        select(orm.CustomField)
        .where(orm.CustomField.user_id == user_id)
        .limit(page_size)
        .offset(offset)
    )

    db_cfs = db_session.scalars(stmt).all()
    items = [schema.CustomField.model_validate(db_cf) for db_cf in db_cfs]

    total_pages = math.ceil(total_cf / page_size)

    return schema.PaginatedResponse[schema.CustomField](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


def get_custom_fields_without_pagination(
    db_session: Session, user_id: uuid.UUID
) -> list[schema.CustomField]:
    stmt = select(orm.CustomField).where(orm.CustomField.user_id == user_id)

    db_cfs = db_session.scalars(stmt).all()
    items = [schema.CustomField.model_validate(db_cf) for db_cf in db_cfs]

    return items


def create_custom_field(
    session: Session,
    name: str,
    type: schema.CustomFieldType,
    user_id: uuid.UUID,
    extra_data: str | None = None,
) -> schema.CustomField:
    cfield = orm.CustomField(
        id=uuid.uuid4(),
        name=name,
        type=type,
        extra_data=extra_data,
        user_id=user_id,
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

    session.commit()
    result = schema.CustomField.model_validate(cfield)

    return result
