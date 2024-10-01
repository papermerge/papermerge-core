from papermerge.core import db
from sqlalchemy.orm import Session
from papermerge.core import schemas


def test_custom_filed_create(db_session: Session):
    cfield = db.create_custom_field(
        db_session, name="cf1", data_type=schemas.CustomFieldType.string
    )

    assert cfield.name == "cf1"
    assert cfield.data_type == schemas.CustomFieldType.string

    retrieved_cf1 = db.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


def test_custom_field_delete(db_session: Session):
    cfield = db.create_custom_field(
        db_session, name="cf1", data_type=schemas.CustomFieldType.string
    )

    retrieved_cf1 = db.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


def test_custom_field_update(db_session: Session):
    cfield = db.create_custom_field(
        db_session, name="cf1", data_type=schemas.CustomFieldType.string
    )

    db.update_custom_field(
        db_session,
        custom_field_id=cfield.id,
        attrs=schemas.UpdateCustomField(name="new_cf1_name"),
    )

    updated_cf1 = db.get_custom_field(db_session, cfield.id)
    assert updated_cf1.name == "new_cf1_name"
