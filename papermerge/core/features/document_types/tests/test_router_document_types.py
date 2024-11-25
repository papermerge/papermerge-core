from sqlalchemy import func
from sqlalchemy.orm import Session

from papermerge.core import schema, orm
from papermerge.core.tests.types import AuthTestClient


def test_create_document_type_with_path_template(
    auth_api_client: AuthTestClient, db_session: Session
):
    count_before = db_session.query(func.count(orm.DocumentType.id)).scalar()
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

    count_after = db_session.query(func.count(orm.DocumentType.id)).scalar()
    assert count_after == 1

    document_type = schema.DocumentType.model_validate(response.json())
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

    document_type = schema.DocumentType.model_validate(response.json())
    assert document_type.path_template == "/home/My ZDF/updated/"


def test_create_document_type(
    make_custom_field, auth_api_client: AuthTestClient, db_session: Session
):
    cf1: schema.CustomField = make_custom_field(name="shop", type="text")
    cf2: schema.CustomField = make_custom_field(name="total", type="monetary")

    count_before = db_session.query(func.count(orm.DocumentType.id)).scalar()
    assert count_before == 0

    response = auth_api_client.post(
        "/document-types/",
        json={"name": "Invoice", "custom_field_ids": [str(cf1.id), str(cf2.id)]},
    )

    assert response.status_code == 201, response.json()

    count_after = db_session.query(func.count(orm.DocumentType.id)).scalar()
    assert count_after == 1

    document_type = schema.DocumentType.model_validate(response.json())
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
    updated_dtype = schema.DocumentType(**response.json())
    assert updated_dtype.name == "Invoice-updated"
    assert set([cf.name for cf in updated_dtype.custom_fields]) == {"cf1", "cf2"}


def test_delete_document_type(
    auth_api_client: AuthTestClient,
    db_session: Session,
    make_document_type,
):
    doc_type = make_document_type(name="Invoice")
    count_before = db_session.query(func.count(orm.DocumentType.id)).scalar()
    assert count_before == 1

    response = auth_api_client.delete(f"/document-types/{doc_type.id}")
    assert response.status_code == 204, response.json()
    count_after = db_session.query(func.count(orm.DocumentType.id)).scalar()

    assert count_after == 0


def test_paginated_result__9_items_first_page(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        make_document_type(name=f"Invoice {i}", user=user)

    params = {"page_size": 5, "page_number": 1}
    response = auth_api_client.get("/document-types/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.DocumentType](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 1
    assert paginated_items.num_pages == 2
    assert len(paginated_items.items) == 5


def test_paginated_result__9_items_second_page(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        make_document_type(name=f"Invoice {i}", user=user)

    params = {"page_size": 5, "page_number": 2}
    response = auth_api_client.get("/document-types/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.DocumentType](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 2
    assert paginated_items.num_pages == 2
    #  total - items_on_first_page
    #  i.e 10 - 5 = 4
    assert len(paginated_items.items) == 4


def test_paginated_result__9_items_3rd_page(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        make_document_type(name=f"Invoice {i}", user=user)

    params = {"page_size": 5, "page_number": 3}
    response = auth_api_client.get("/document-types/", params=params)

    assert response.status_code == 200, response.json()

    paginated_items = schema.PaginatedResponse[schema.DocumentType](**response.json())

    assert paginated_items.page_size == 5
    assert paginated_items.page_number == 3
    assert paginated_items.num_pages == 2
    #  no items on first page: there are only two pages
    assert len(paginated_items.items) == 0


def test_document_types_all_route(
    make_document_type, auth_api_client: AuthTestClient, user
):
    total_doc_type_items = 9
    for i in range(total_doc_type_items):
        make_document_type(name=f"Invoice {i}", user=user)

    response = auth_api_client.get("/document-types/all")

    assert response.status_code == 200, response.json()

    items = [schema.DocumentType(**kw) for kw in response.json()]

    assert len(items) == total_doc_type_items
