import pytest
from sqlalchemy.orm import Session

from papermerge.core import db, schemas
from papermerge.core.models import User


@pytest.mark.django_db(transaction=True)
def test_custom_filed_create(db_session: Session, user: User):
    cfield = db.create_custom_field(
        db_session,
        name="cf1",
        type=schemas.CustomFieldType.text,
        user_id=user.id,
    )

    assert cfield.name == "cf1"
    assert cfield.type == schemas.CustomFieldType.text

    retrieved_cf1 = db.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


@pytest.mark.django_db(transaction=True)
def test_custom_field_delete(db_session: Session, user: User):
    cfield = db.create_custom_field(
        db_session,
        name="cf1",
        type=schemas.CustomFieldType.text,
        user_id=user.id,
    )

    retrieved_cf1 = db.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


@pytest.mark.django_db(transaction=True)
def test_custom_field_update(db_session: Session, user: User):
    cfield = db.create_custom_field(
        db_session,
        name="cf1",
        type=schemas.CustomFieldType.text,
        user_id=user.id,
    )

    db.update_custom_field(
        db_session,
        custom_field_id=cfield.id,
        attrs=schemas.UpdateCustomField(name="new_cf1_name"),
    )

    updated_cf1 = db.get_custom_field(db_session, cfield.id)
    assert updated_cf1.name == "new_cf1_name"
