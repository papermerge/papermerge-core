import pytest
from sqlalchemy import func
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db import models
from papermerge.test.types import AuthTestClient


@pytest.mark.django_db(transaction=True)
def test_create_document_type(
    make_custom_field, auth_api_client: AuthTestClient, db_session: Session
):
    cf1: schemas.CustomField = make_custom_field(name="shop", data_type="string")
    cf2: schemas.CustomField = make_custom_field(name="total", data_type="monetary")

    count_before = db_session.query(func.count(models.DocumentType.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/document-types/",
        json={"name": "Invoice", "custom_field_ids": [str(cf1.id), str(cf2.id)]},
    )

    assert response.status_code == 201, response.json()

    count_after = db_session.query(func.count(models.DocumentType.id)).scalar()
    assert count_after == 1

    document_type = schemas.DocumentType.model_validate(response.json())
    assert document_type.name == "Invoice"
    assert len(document_type.custom_fields) == 2
    assert set([cf.name for cf in document_type.custom_fields]) == {"shop", "total"}
