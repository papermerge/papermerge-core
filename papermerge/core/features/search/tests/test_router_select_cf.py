"""
Test search router with select custom field filtering.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from core.tests.types import AuthTestClient
from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.document.db import api as doc_dbapi


async def test_search_documents_by_select_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_custom_field_v2,
    make_document_type_with_custom_fields,
    make_document
):
    """
    End-to-end test for searching documents filtered by select custom field.

    Scenario:
    - Create a select custom field "Department" with options: HR, DEV, QA
    - Create a document type "Employee Record" using this custom field
    - Create 5 documents with different department assignments:
        - doc_1: HR only
        - doc_2: DEV only
        - doc_3: QA only
        - doc_4: no value assigned
    """
    employee_record_type = await make_document_type_with_custom_fields(
        name="Employee Record",
        custom_fields=[
            {
                "name": "Department",
                "type_handler": "select",
                "config": {
                    "options": [
                        {"value": "hr", "label": "HR"},
                        {"value": "dev", "label": "DEV"},
                        {"value": "qa", "label": "QA"}
                    ]
                }
            }
        ]
    )

    # Step 3: Create documents
    doc_1 = await make_document(
        title="employee_alice.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_2 = await make_document(
        title="employee_bob.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_3 = await make_document(
        title="employee_charlie.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_4 = await make_document(
        title="employee_diana.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    # Assign document type to all documents
    for doc in [doc_1, doc_2, doc_3, doc_4]:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=employee_record_type.id
        )

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Department": "hr"}
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_2.id,
        custom_fields={"Department": "dev"}
    )
    # doc_3: HR, DEV (both)
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_3.id,
        custom_fields={"Department": "qa"}
    )
    payload = {
        "filters": {
            "custom_fields": [
                {
                    "field_name": "Department",
                    "operator": "eq",
                    "value": "hr"
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()

    result = response.json()
    assert "items" in result

    returned_titles = {item["title"] for item in result["items"]}

    assert "employee_alice.pdf" in returned_titles, "doc_1/alice should be found"
    assert "employee_bob.pdf" not in returned_titles, "doc_2/bob should NOT be found"
    assert "employee_charlie.pdf" not in returned_titles, "doc_3/charlie should NOT be found"
    assert "employee_diana.pdf" not in returned_titles, "doc_4/diana should NOT be found"

    assert len(result["items"]) == 1


async def test_search_documents_by_select_custom_field_is_null(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_custom_field_v2,
    make_document_type_with_custom_fields,
    make_document
):
    """
    Scenario addresses searching by custom field
    of type `select` with operator = `is_null` | `is_not_null`
    """
    employee_record_type = await make_document_type_with_custom_fields(
        name="Employee Record",
        custom_fields=[
            {
                "name": "Department",
                "type_handler": "select",
                "config": {
                    "options": [
                        {"value": "h", "label": "HR"},
                        {"value": "d", "label": "DEV"},
                        {"value": "q", "label": "QA"}
                    ]
                }
            }
        ]
    )

    # Step 3: Create documents
    doc_1 = await make_document(
        title="employee_alice.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_2 = await make_document(
        title="employee_bob.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_3 = await make_document(
        title="employee_charlie.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    await make_document(
        title="Unrelated.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    # Assign document type to all documents
    for doc in [doc_1, doc_2, doc_3]:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=employee_record_type.id
        )

    # only doc_1.pdf has value set
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Department": "h"}
    )

    payload = {
        "filters": {
            "custom_fields": [
                {
                    "field_name": "Department",
                    "operator": "is_null",
                }
            ],
            "categories": [
                {
                    "operator": "any",
                    "values": [employee_record_type.name]
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }
    # Search all document of Category "Employee Record"
    # which have custom field "Department" cf set to null (i.e. not yet set)
    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()

    result = response.json()
    assert "items" in result

    returned_titles = {item["title"] for item in result["items"]}

    assert "employee_alice.pdf" not in returned_titles, "doc_1/alice should be found"
    assert "employee_bob.pdf" in returned_titles, "doc_2/bob should NOT be found"
    assert "employee_charlie.pdf" in returned_titles, "doc_3/charlie should NOT be found"

    assert len(result["items"]) == 2

    payload = {
        "filters": {
            "custom_fields": [
                {
                    "field_name": "Department",
                    "operator": "is_not_null",
                }
            ],
            "categories": [
                {
                    "operator": "any",
                    "values": [employee_record_type.name]
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }
    # Search all document of Category "Employee Record"
    # which have custom field "Department" set to NOT null (i.e. value is set)
    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()

    result = response.json()
    assert "items" in result

    returned_titles = {item["title"] for item in result["items"]}

    assert "employee_alice.pdf" in returned_titles, "doc_1/alice should be found"

    assert len(result["items"]) == 1
