import pytest
from sqlalchemy import func
from sqlalchemy.orm import Session

from papermerge.core.db import models
from papermerge.test.types import AuthTestClient


@pytest.mark.django_db(transaction=True)
def test_create_custom_field(auth_api_client: AuthTestClient, db_session: Session):
    count_before = db_session.query(func.count(models.CustomField.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/custom-fields/", json={"name": "cf1", "data_type": "int"}
    )
    assert response.status_code == 201, response.json()

    count_after = db_session.query(func.count(models.CustomField.id)).scalar()
    assert count_after == 1
