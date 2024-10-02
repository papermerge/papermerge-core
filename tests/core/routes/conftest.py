import base64
import json

import pytest
from sqlalchemy.orm import Session

from papermerge.core import db, schemas
from papermerge.core.models import User


def b64e(s):
    return base64.b64encode(s.encode()).decode()


@pytest.fixture
def token():
    data = {
        "sub": "100",
        "preferred_username": "montaigne",
        "email": "montaingne@mail.com",
    }
    json_str = json.dumps(data)

    payload = b64e(json_str)

    return f"ignore_me.{payload}.ignore_me_too"


@pytest.fixture
def custom_field_cf1(db_session: Session, user: User):
    return db.create_custom_field(
        db_session,
        name="cf1",
        data_type=schemas.CustomFieldType.string,
        user_id=user.id,
    )


@pytest.fixture
def make_custom_field(db_session: Session, user: User):
    def _make_custom_field(name: str, data_type: schemas.CustomFieldType):
        return db.create_custom_field(
            db_session,
            name=name,
            data_type=data_type,
            user_id=user.id,
        )

    return _make_custom_field
