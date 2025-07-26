import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.custom_fields import schema
from papermerge.core.features.custom_fields.db import api as dbapi


@pytest.fixture
async def custom_field_cf1(db_session: AsyncSession, user):
    return await dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )
