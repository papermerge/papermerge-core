from sqlalchemy.orm import Session

from papermerge.core.features.custom_fields import schema
from papermerge.core.features.custom_fields.db import api as dbapi
from papermerge.core.features.users.db.orm import User


def test_custom_filed_create(db_session: Session, user: User):
    cfield = dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )

    assert cfield.name == "cf1"
    assert cfield.type == schema.CustomFieldType.text

    retrieved_cf1 = dbapi.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


def test_custom_field_delete(db_session: Session, user: User):
    cfield = dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )

    retrieved_cf1 = dbapi.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


def test_custom_field_update(db_session: Session, user: User):
    cfield = dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )

    dbapi.update_custom_field(
        db_session,
        custom_field_id=cfield.id,
        attrs=schema.UpdateCustomField(name="new_cf1_name"),
    )

    updated_cf1 = dbapi.get_custom_field(db_session, cfield.id)
    assert updated_cf1.name == "new_cf1_name"
