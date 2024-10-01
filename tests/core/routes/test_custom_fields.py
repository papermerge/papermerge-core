import pytest
from sqlalchemy import func
from sqlalchemy.orm import Session

from papermerge.core import schemas
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


@pytest.mark.django_db(transaction=True)
def test_update_custom_field(
    auth_api_client: AuthTestClient,
    db_session: Session,
    custom_field_cf1,
):
    count_before = db_session.query(func.count(models.CustomField.id)).scalar()
    assert count_before == 1

    response = auth_api_client.patch(
        f"/custom-fields/{custom_field_cf1.id}",
        json={"name": "cf1_updated", "data_type": "int"},
    )
    assert response.status_code == 200
    updated_cf = schemas.CustomField(**response.json())
    assert updated_cf.name == "cf1_updated"


@pytest.mark.django_db(transaction=True)
def test_delete_custom_field(
    auth_api_client: AuthTestClient,
    db_session: Session,
    custom_field_cf1,
):
    count_before = db_session.query(func.count(models.CustomField.id)).scalar()
    assert count_before == 1

    response = auth_api_client.delete(f"/custom-fields/{custom_field_cf1.id}")
    assert response.status_code == 204
    count_after = db_session.query(func.count(models.CustomField.id)).scalar()
    assert count_after == 0
