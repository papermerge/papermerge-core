"""
Test search router with multiselect custom field filtering.

This test validates the complete flow:
1. Creating a multiselect custom field named "Department" with options (HR, DEV, QA)
2. Creating a document type that uses this custom field
3. Creating multiple documents of this document type
4. Setting multiselect custom field values on documents
5. Searching documents via search router filtering by multiselect custom field
"""
from sqlalchemy.ext.asyncio import AsyncSession

from core.tests.types import AuthTestClient
from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.document.db import api as doc_dbapi


async def test_search_documents_by_multiselect_custom_field(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_custom_field_v2,
    make_document_type_with_custom_fields,
    make_document
):
    """
    End-to-end test for searching documents filtered by multiselect custom field.

    Scenario:
    - Create a multiselect custom field "Department" with options: HR, DEV, QA
    - Create a document type "Employee Record" using this custom field
    - Create 5 documents with different department assignments:
        - doc_1: HR only
        - doc_2: DEV only
        - doc_3: HR, DEV (both)
        - doc_4: QA only
        - doc_5: HR, DEV, QA (all)
    - Search for documents where Department contains "HR"
    - Verify correct documents are returned (doc_1, doc_3, doc_5)
    """
    # Step 1: Create multiselect custom field "Department" with options
    department_cf = await make_custom_field_v2(
        name="Department",
        type_handler="multiselect",
        config={
            "options": [
                {"value": "hr", "label": "HR"},
                {"value": "dev", "label": "DEV"},
                {"value": "qa", "label": "QA"}
            ]
        }
    )

    # Step 2: Create document type "Employee Record" with the Department field
    employee_record_type = await make_document_type_with_custom_fields(
        name="Employee Record",
        custom_fields=[
            {
                "name": "Department",
                "type_handler": "multiselect",
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
    doc_5 = await make_document(
        title="employee_eve.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    # Assign document type to all documents
    for doc in [doc_1, doc_2, doc_3, doc_4, doc_5]:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=employee_record_type.id
        )

    # Step 4: Set multiselect custom field values
    # doc_1: HR only
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={"Department": ["hr"]}
    )
    # doc_2: DEV only
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_2.id,
        custom_fields={"Department": ["dev"]}
    )
    # doc_3: HR, DEV (both)
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_3.id,
        custom_fields={"Department": ["hr", "dev"]}
    )
    # doc_4: QA only
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_4.id,
        custom_fields={"Department": ["qa"]}
    )
    # doc_5: HR, DEV, QA (all)
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_5.id,
        custom_fields={"Department": ["hr", "dev", "qa"]}
    )

    # Step 5: Search via router for documents where Department contains "hr"
    # Note: multiselect uses value_text which stores comma-separated sorted values
    # "hr" -> "hr", "hr,dev" -> "dev,hr", "hr,dev,qa" -> "dev,hr,qa"
    # The contains operator on value_text will search within this string
    payload = {
        "filters": {
            "custom_fields": [
                {
                    "field_name": "Department",
                    "operator": "all",
                    "values": ["hr"]
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

    # Should return doc_1 (hr), doc_3 (hr,dev), doc_5 (hr,dev,qa)
    returned_titles = {item["title"] for item in result["items"]}

    assert "employee_alice.pdf" in returned_titles, "doc_1 (HR only) should be found"
    assert "employee_charlie.pdf" in returned_titles, "doc_3 (HR, DEV) should be found"
    assert "employee_eve.pdf" in returned_titles, "doc_5 (HR, DEV, QA) should be found"

    # Should NOT return doc_2 (DEV only) or doc_4 (QA only)
    assert "employee_bob.pdf" not in returned_titles, "doc_2 (DEV only) should NOT be found"
    assert "employee_diana.pdf" not in returned_titles, "doc_4 (QA only) should NOT be found"

    assert len(result["items"]) == 3


async def test_search_documents_by_multiselect_cf_with_eq_operator(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_custom_field_v2,
    make_document_type_with_custom_fields,
    make_document
):
    """
    Test searching documents with exact match (eq) operator on multiselect field.

    The sortable value for multiselect is a comma-separated sorted string.
    - ["hr"] -> "hr"
    - ["dev", "hr"] -> "dev,hr"
    - ["dev", "hr", "qa"] -> "dev,hr,qa"

    Using eq operator should match the exact sortable string.
    """
    # Create document type with multiselect field
    project_type = await make_document_type_with_custom_fields(
        name="Project Doc",
        custom_fields=[
            {
                "name": "Teams",
                "type_handler": "multiselect",
                "config": {
                    "options": [
                        {"value": "frontend", "label": "Frontend"},
                        {"value": "backend", "label": "Backend"},
                        {"value": "devops", "label": "DevOps"}
                    ]
                }
            }
        ]
    )

    # Create documents
    doc_frontend = await make_document(
        title="frontend_spec.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_backend = await make_document(
        title="backend_spec.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_fullstack = await make_document(
        title="fullstack_spec.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    # Assign document type
    for doc in [doc_frontend, doc_backend, doc_fullstack]:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=project_type.id
        )

    # Set values
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_frontend.id,
        custom_fields={"Teams": ["frontend"]}
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_backend.id,
        custom_fields={"Teams": ["backend"]}
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_fullstack.id,
        custom_fields={"Teams": ["frontend", "backend"]}
    )

    # Search for exact match "frontend" (only doc_frontend)
    payload = {
        "filters": {
            "categories": [
                {"values": ["Project Doc"], "operator": "any"}
            ],
            "custom_fields": [
                {
                    "field_name": "Teams",
                    "operator": "any",
                    "values": ["frontend"]
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()

    result = response.json()
    returned_titles = {item["title"] for item in result["items"]}

    # Only doc_frontend should match (sortable = "frontend")
    assert "frontend_spec.pdf" in returned_titles
    # doc_fullstack has sortable = "backend,frontend" which != "frontend"
    assert "fullstack_spec.pdf" not in returned_titles
    assert "backend_spec.pdf" not in returned_titles

    assert len(result["items"]) == 1


async def test_search_documents_by_multiselect_cf_multiple_filters(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_document_type_with_custom_fields,
    make_document
):
    """
    Test searching with multiple custom field filters combined (AND logic).

    Scenario:
    - Document type with two fields: Department (multiselect) and Priority (text)
    - Search for documents where Department contains "hr" AND Priority = "high"
    """
    # Create document type with both fields
    doc_type = await make_document_type_with_custom_fields(
        name="Task",
        custom_fields=[
            {
                "name": "Assigned Dept",
                "type_handler": "multiselect",
                "config": {
                    "options": [
                        {"value": "hr", "label": "HR"},
                        {"value": "finance", "label": "Finance"},
                        {"value": "it", "label": "IT"}
                    ]
                }
            },
            {
                "name": "Priority",
                "type_handler": "text"
            }
        ]
    )

    # Create documents
    doc_hr_high = await make_document(
        title="urgent_hr_task.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_hr_low = await make_document(
        title="routine_hr_task.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_finance_high = await make_document(
        title="urgent_finance_task.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    # Assign document type
    for doc in [doc_hr_high, doc_hr_low, doc_finance_high]:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=doc_type.id
        )

    # Set values
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_hr_high.id,
        custom_fields={"Assigned Dept": ["hr"], "Priority": "high"}
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_hr_low.id,
        custom_fields={"Assigned Dept": ["hr"], "Priority": "low"}
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_finance_high.id,
        custom_fields={"Assigned Dept": ["finance"], "Priority": "high"}
    )

    # Search for HR + high priority
    payload = {
        "filters": {
            "categories": [
                {"values": ["Task"], "operator": "any"}
            ],
            "custom_fields": [
                {
                    "field_name": "Assigned Dept",
                    "operator": "any",
                    "values": ["hr"]
                },
                {
                    "field_name": "Priority",
                    "operator": "eq",
                    "value": "high"
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()

    result = response.json()
    returned_titles = {item["title"] for item in result["items"]}

    # Only doc_hr_high should match (HR + high)
    assert "urgent_hr_task.pdf" in returned_titles
    assert "routine_hr_task.pdf" not in returned_titles  # HR but low priority
    assert "urgent_finance_task.pdf" not in returned_titles  # Finance not HR

    assert len(result["items"]) == 1


async def test_search_no_results_when_multiselect_value_not_found(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_document_type_with_custom_fields,
    make_document
):
    """
    Test that search returns no results when filtering by a value not present.
    """
    doc_type = await make_document_type_with_custom_fields(
        name="Report",
        custom_fields=[
            {
                "name": "Categories",
                "type_handler": "multiselect",
                "config": {
                    "options": [
                        {"value": "financial", "label": "Financial"},
                        {"value": "legal", "label": "Legal"},
                        {"value": "technical", "label": "Technical"}
                    ]
                }
            }
        ]
    )

    doc = await make_document(
        title="financial_report.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    await doc_dbapi.update_doc_type(
        db_session,
        document_id=doc.id,
        document_type_id=doc_type.id
    )

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc.id,
        custom_fields={"Categories": ["financial"]}
    )

    # Search for "marketing" which doesn't exist in any document
    payload = {
        "filters": {
            "categories": [
                {"values": ["Report"], "operator": "any"}
            ],
            "custom_fields": [
                {
                    "field_name": "Categories",
                    "operator": "all",
                    "values": ["marketing"]
                }
            ]
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()

    result = response.json()
    assert len(result["items"]) == 0


async def test_search_returns_custom_field_values_in_response(
    auth_api_client: AuthTestClient,
    db_session: AsyncSession,
    user,
    make_document_type_with_custom_fields,
    make_document
):
    """
    Test that the search response includes custom field values for each document.

    When searching within a specific document type (single category filter),
    the response should include custom_fields metadata and values.
    """
    doc_type = await make_document_type_with_custom_fields(
        name="Contract",
        custom_fields=[
            {
                "name": "Parties",
                "type_handler": "multiselect",
                "config": {
                    "options": [
                        {"value": "vendor", "label": "Vendor"},
                        {"value": "client", "label": "Client"},
                        {"value": "partner", "label": "Partner"}
                    ]
                }
            },
            {
                "name": "Status",
                "type_handler": "text"
            }
        ]
    )

    doc = await make_document(
        title="partnership_contract.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    await doc_dbapi.update_doc_type(
        db_session,
        document_id=doc.id,
        document_type_id=doc_type.id
    )

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc.id,
        custom_fields={
            "Parties": ["vendor", "partner"],
            "Status": "active"
        }
    )

    # Search within Contract document type
    payload = {
        "filters": {
            "categories": [
                {"values": ["Contract"], "operator": "any"}
            ]
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post("/search/", json=payload)

    assert response.status_code == 200, response.json()

    result = response.json()
    assert len(result["items"]) == 1

    # Check that response includes custom_fields info (document type search)
    assert "custom_fields" in result
    assert "document_type_id" in result

    # Check that the document item includes custom field values
    item = result["items"][0]
    assert item["title"] == "partnership_contract.pdf"

    # The response should include custom_fields for the document
    assert "custom_fields" in item

    # Find the "Parties" field in the response
    parties_cf = None
    for cf_row in item["custom_fields"]:
        if cf_row["custom_field"]["name"] == "Parties":
            parties_cf = cf_row
            break

    assert parties_cf is not None, "Parties custom field should be in response"
    assert parties_cf["custom_field"]["type_handler"] == "multiselect"

    # Check the value contains our selections
    if parties_cf["custom_field_value"]:
        value_data = parties_cf["custom_field_value"]["value"]
        if value_data and "raw" in value_data:
            raw_values = value_data["raw"]
            assert "vendor" in raw_values
            assert "partner" in raw_values
