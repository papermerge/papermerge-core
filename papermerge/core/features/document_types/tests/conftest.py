import pytest

from papermerge.core import schemas
from papermerge.core.db import create_custom_field
from papermerge.core.db import models as orm
from papermerge.core.db.engine import Session
from papermerge.core.features.document_types import db
from papermerge.core.schemas import CustomFieldType


@pytest.fixture
def make_custom_field(db_session: Session, user: orm.User):
    def _make_custom_field(name: str, type: schemas.CustomFieldType):
        return create_custom_field(
            db_session,
            name=name,
            type=type,
            user_id=user.id,
        )

    return _make_custom_field


@pytest.fixture
def make_document_type(db_session: Session, user: orm.User, make_custom_field):
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
