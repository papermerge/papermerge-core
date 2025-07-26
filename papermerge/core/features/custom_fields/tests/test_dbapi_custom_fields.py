from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.custom_fields import schema
from papermerge.core.features.custom_fields.db import api as dbapi
from papermerge.core.features.users.db.orm import User


async def test_custom_filed_create(db_session: AsyncSession, user: User):
    cfield = await dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )

    assert cfield.name == "cf1"
    assert cfield.type == schema.CustomFieldType.text

    retrieved_cf1 = await dbapi.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


async def test_custom_field_delete(db_session: AsyncSession, user: User):
    cfield = await dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )

    retrieved_cf1 = await dbapi.get_custom_field(db_session, cfield.id)
    assert retrieved_cf1.id == cfield.id
    assert retrieved_cf1.name == cfield.name


async def test_custom_field_update(db_session: AsyncSession, user: User):
    cfield = await dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )

    await dbapi.update_custom_field(
        db_session,
        custom_field_id=cfield.id,
        attrs=schema.UpdateCustomField(name="new_cf1_name", user_id=user.id),
    )

    updated_cf1 = await dbapi.get_custom_field(db_session, cfield.id)
    assert updated_cf1.name == "new_cf1_name"
