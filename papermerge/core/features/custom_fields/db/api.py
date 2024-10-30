import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core.features.custom_fields import schema
from papermerge.core.features.custom_fields.db import orm

logger = logging.getLogger(__name__)


def get_custom_fields(session: Session) -> list[schema.CustomField]:
    stmt = select(orm.CustomField)
    db_items = session.scalars(stmt).all()
    result = [schema.CustomField.model_validate(db_item) for db_item in db_items]

    return result


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
