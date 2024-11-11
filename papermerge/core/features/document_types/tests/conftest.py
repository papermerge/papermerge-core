import pytest

from papermerge.core import orm, db, dbapi, schema


@pytest.fixture
def make_custom_field(db_session: db.Session, user: orm.User):
    def _make_custom_field(name: str, type: schema.CustomFieldType):
        return dbapi.create_custom_field(
            db_session,
            name=name,
            type=type,
            user_id=user.id,
        )

    return _make_custom_field
