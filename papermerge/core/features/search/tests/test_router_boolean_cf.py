from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.tests.types import AuthTestClient
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
    """
    In this scenario there are 3 documents of type/category "Exam Result".
    Category "Exam Result" contains one cf of type "boolean": "Passed" (boolean)

    Document |  Pass Flag
    =================================================
    Alice    |  True/checked
    -------------------------------------------------
    Bob      |  False/not checked
    --------------------------------------------------
    Charlie  |  Not yet set (in UI is not checked)

    When searching with operator "is_checked" - only Alice's document should
    be returned in results.
    When searching with operator "is_not_checked" - both Bob and Charlies'
    documents should be returned in result. Notice that Bob's document cf
    was explicitely set to "False" (was unchecked in UI) while Charlie's
    document cf was never set (e.g. user change make this document of
    category "Exam Result" but did not interact yet with "Passed" cf.

    From user perspective Bob and Charlie documents are "unchecked".
    Internally there is a difference though: for Bob the value `False` is
    explicitly set i.e. there is an entry in `custom_field_values` table
    while Charlie's document does not have an entry in `custom_field_values`
    yet.
    """
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

    # Alice document cf "Passed" is explicitly set to True
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=alice_doc.id,
        custom_fields={"Passed": True}
    )
    # Bob document cf "Passed" is explicitly set to False
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=bob_doc.id,
        custom_fields={"Passed": False}
    )
    # Charlie document cf "Passed" is not set at all!

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

    # only Alice doc has "Passed" flag set to `True`
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
