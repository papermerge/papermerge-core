import pytest

from papermerge.core.db.engine import Session
from papermerge.core.features.custom_fields import schema
from papermerge.core.features.custom_fields.db import api as dbapi


@pytest.fixture
def custom_field_cf1(db_session: Session, user):
    return dbapi.create_custom_field(
        db_session,
        name="cf1",
        type=schema.CustomFieldType.text,
        user_id=user.id,
    )
