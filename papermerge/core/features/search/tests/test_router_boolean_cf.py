"""
Test search router with select custom field filtering.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from core.tests.types import AuthTestClient
from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.document.db import api as doc_dbapi


async def test_search_documents_by_boolean_cf(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_custom_field_v2,
    make_document_type_with_custom_fields,
    make_document
):
    exam_result_type = await make_document_type_with_custom_fields(
        name="Exam Result",
        custom_fields=[
            {
                "name": "Passed",
                "type_handler": "boolean",
            }
        ]
    )

    alice_doc = await make_document(
        title="alice.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    bob_doc = await make_document(
        title="bob.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    charlie_doc = await make_document(
        title="charlie.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    # Assign document type to all documents
    for doc in [alice_doc, bob_doc, charlie_doc]:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=exam_result_type.id
        )

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=alice_doc.id,
        custom_fields={"Passed": True}
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=bob_doc.id,
        custom_fields={"Passed": False}
    )
    # Find document with checked field
    payload = {
        "filters": {
            "custom_fields": [
                {
                    "field_name": "Passed",
                    "operator": "is_checked",
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

    assert "alice.pdf" in returned_titles, "alice should be found"
    assert len(result["items"]) == 1

    # Find document with unchecked field
    payload = {
        "filters": {
            "custom_fields": [
                {
                    "field_name": "Passed",
                    "operator": "is_not_checked",
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

    assert "bob.pdf" in returned_titles, "bob should be found"
    assert "charlie.pdf" in returned_titles, "charlie should be found"
    assert len(result["items"]) == 2
