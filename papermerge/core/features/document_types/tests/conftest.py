import pytest

from papermerge.core.db.engine import Session
from papermerge.core.features.custom_fields.db.api import create_custom_field
from papermerge.core.features.custom_fields.schema import CustomFieldType
from papermerge.core.features.document_types import db
from papermerge.core.features.users.db import orm as users_orm


@pytest.fixture
def make_custom_field(db_session: Session, user: users_orm.User):
    def _make_custom_field(name: str, type: CustomFieldType):
        return create_custom_field(
            db_session,
            name=name,
            type=type,
            user_id=user.id,
        )

    return _make_custom_field


@pytest.fixture
def make_document_type(db_session: Session, user: users_orm.User, make_custom_field):
    cf = make_custom_field(name="some-random-cf", type=CustomFieldType.boolean)

    def _make_document_type(name: str, path_template: str | None = None):
        return db.create_document_type(
            db_session,
            name=name,
            custom_field_ids=[cf.id],
            path_template=path_template,
            user_id=user.id,
        )

    return _make_document_type
