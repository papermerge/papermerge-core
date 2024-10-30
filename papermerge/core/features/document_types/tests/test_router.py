from sqlalchemy import func
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.features.document_types.db import DocumentType
from papermerge.test.types import AuthTestClient


def test_create_document_type_with_path_template(
    auth_api_client: AuthTestClient, db_session: Session
):
    count_before = db_session.query(func.count(DocumentType.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/document-types/",
        json={
            "name": "Invoice",
            "path_template": "/home/My ZDF/",
            "custom_field_ids": [],
        },
    )
    assert response.status_code == 201, response.json()

    count_after = db_session.query(func.count(DocumentType.id)).scalar()
    assert count_after == 1

    document_type = schemas.DocumentType.model_validate(response.json())
    assert document_type.name == "Invoice"
    assert document_type.path_template == "/home/My ZDF/"


def test_update_document_type_with_path_template(
    make_document_type, auth_api_client: AuthTestClient, db_session: Session
):
    doc_type = make_document_type(name="ZDF", path_template="/home/")
    response = auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "name": "Invoice",
            "path_template": "/home/My ZDF/updated/",
            "custom_field_ids": [],
        },
    )

    document_type = schemas.DocumentType.model_validate(response.json())
    assert document_type.path_template == "/home/My ZDF/updated/"


def test_create_document_type(
    make_custom_field, auth_api_client: AuthTestClient, db_session: Session
):
    cf1: schemas.CustomField = make_custom_field(name="shop", type="text")
    cf2: schemas.CustomField = make_custom_field(name="total", type="monetary")

    count_before = db_session.query(func.count(DocumentType.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/document-types/",
        json={"name": "Invoice", "custom_field_ids": [str(cf1.id), str(cf2.id)]},
    )

    assert response.status_code == 201, response.json()

    count_after = db_session.query(func.count(DocumentType.id)).scalar()
    assert count_after == 1

    document_type = schemas.DocumentType.model_validate(response.json())
    assert document_type.name == "Invoice"
    assert len(document_type.custom_fields) == 2
    assert set([cf.name for cf in document_type.custom_fields]) == {"shop", "total"}


def test_list_document_types(make_document_type, auth_api_client: AuthTestClient):
    make_document_type(name="Invoice")
    response = auth_api_client.get("/document-types/")

    assert response.status_code == 200, response.json()


def test_update_document_type(
    auth_api_client: AuthTestClient,
    db_session: Session,
    make_document_type,
    make_custom_field,
):
    cf1 = make_custom_field(name="cf1", type="text")
    cf2 = make_custom_field(name="cf2", type="boolean")
    doc_type = make_document_type(name="Invoice")

    response = auth_api_client.patch(
        f"/document-types/{doc_type.id}",
        json={
            "name": "Invoice-updated",
            "custom_field_ids": [str(cf1.id), str(cf2.id)],
        },
    )
    assert response.status_code == 200
    updated_dtype = schemas.DocumentType(**response.json())
    assert updated_dtype.name == "Invoice-updated"
    assert set([cf.name for cf in updated_dtype.custom_fields]) == {"cf1", "cf2"}


def test_delete_document_type(
    auth_api_client: AuthTestClient,
    db_session: Session,
    make_document_type,
):
    doc_type = make_document_type(name="Invoice")
    count_before = db_session.query(func.count(DocumentType.id)).scalar()
    assert count_before == 1

    response = auth_api_client.delete(f"/document-types/{doc_type.id}")
    assert response.status_code == 204, response.json()
    count_after = db_session.query(func.count(DocumentType.id)).scalar()

    assert count_after == 0
