import logging
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db import models

logger = logging.getLogger(__name__)


def get_custom_fields(session: Session) -> list[schemas.CustomField]:
    stmt = select(models.Group)
    db_items = session.scalars(stmt).all()
    result = [schemas.CustomField.model_validate(db_item) for db_item in db_items]

    return result


def create_custom_field(
    session: Session,
    name: str,
    data_type: schemas.CustomFieldType,
    user_id: uuid.UUID,
    extra_data: str | None = None,
) -> schemas.CustomField:
    cfield = models.CustomField(
        id=uuid.uuid4(),
        name=name,
        data_type=data_type,
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
    stmt = select(models.CustomField).where(models.CustomField.id == custom_field_id)
    db_item = session.scalars(stmt).unique().one()
    result = schemas.CustomField.model_validate(db_item)
    return result


def delete_custom_field(session: Session, custom_field_id: uuid.UUID):
    stmt = select(models.CustomField).where(models.CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.delete(cfield)
    session.commit()


def update_custom_field(
    session: Session, custom_field_id: uuid.UUID, attrs: schemas.UpdateCustomField
) -> schemas.CustomField:
    stmt = select(models.CustomField).where(models.CustomField.id == custom_field_id)
    cfield = session.execute(stmt).scalars().one()
    session.add(cfield)

    if attrs.name:
        cfield.name = attrs.name

    if attrs.data_type:
        cfield.data_type = attrs.data_type

    if attrs.extra_data:
        cfield.extra_data = attrs.extra_data

    session.commit()
    result = schemas.CustomField.model_validate(cfield)

    return result
