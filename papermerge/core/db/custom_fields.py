import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core import schemas

from .models import CustomField

logger = logging.getLogger(__name__)


def get_custom_fields(session: Session) -> list[schemas.CustomField]:
    stmt = select(CustomField)
    db_items = session.scalars(stmt).all()
    result = [schemas.CustomField.model_validate(db_item) for db_item in db_items]

    return result


def create_custom_field(
    session: Session,
    name: str,
    type: schemas.CustomFieldType,
    user_id: uuid.UUID,
    extra_data: str | None = None,
) -> schemas.CustomField:
    cfield = CustomField(
        id=uuid.uuid4(),
        name=name,
        type=type,
        extra_data=extra_data,
        user_id=user_id,
    )
    session.add(cfield)
    session.commit()

    result = schemas.CustomField.model_validate(cfield)
    return result


def get_custom_field(
    session: Session, custom_field_id: uuid.UUID
) -> schemas.CustomField:
    stmt = select(CustomField).where(CustomField.id == custom_field_id)
    db_item = session.scalars(stmt).unique().one()
    result = schemas.CustomField.model_validate(db_item)
    return result


def delete_custom_field(session: Session, custom_field_id: uuid.UUID):
    stmt = select(CustomField).where(CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.delete(cfield)
    session.commit()


def update_custom_field(
    session: Session, custom_field_id: uuid.UUID, attrs: schemas.UpdateCustomField
) -> schemas.CustomField:
    stmt = select(CustomField).where(CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.add(cfield)

    if attrs.name:
        cfield.name = attrs.name

    if attrs.type:
        cfield.type = attrs.type

    if attrs.extra_data:
        cfield.extra_data = attrs.extra_data

    session.commit()
    result = schemas.CustomField.model_validate(cfield)

    return result
