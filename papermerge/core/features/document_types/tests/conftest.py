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


@pytest.fixture
def make_document_type(db_session: db.Session, user: orm.User, make_custom_field):
    cf = make_custom_field(name="some-random-cf", type=schema.CustomFieldType.boolean)

    def _make_document_type(name: str, path_template: str | None = None):
        return dbapi.create_document_type(
            db_session,
            name=name,
            custom_field_ids=[cf.id],
            path_template=path_template,
            user_id=user.id,
        )

    return _make_document_type
