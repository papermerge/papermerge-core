from collections import namedtuple

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import db
from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.document.db import api as doc_dbapi
from core.tests.types import AuthTestClient


async def test_search_with_empty_categories_filter(
    auth_api_client: AuthTestClient
):
    payload = {
        "filters": {
            "categories":[
                {"values":[],"operator":"any"}
            ],
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post(
        f"/search/",
        json=payload,
    )

    assert response.status_code == 200, response.json()


async def test_search_with_empty_tags_filter(
    auth_api_client: AuthTestClient
):
    payload = {
        "filters": {
            "tags":[
                {"values":[],"operator":"any"}
            ],
        },
        "page_number": 1,
        "page_size": 25
    }

    response = await auth_api_client.post(
        f"/search/",
        json=payload,
    )

    assert response.status_code == 200, response.json()



async def test_fitler_document_numeric_custom_field(
    db_session: AsyncSession,
    user,
    make_document_with_numeric_cf
):
    doc1, custom_field1 = await make_document_with_numeric_cf(
        doc_type_name="Invoice",
        doc_title="large-bill.pdf",
        field_name="Amount",
        user=user,
        precision=2  # 2 decimal places
    )

    doc2, custom_field2 = await make_document_with_numeric_cf(
        doc_type_name="Invoice",
        doc_title="tiny-bill.pdf",
        field_name="Amount",
        user=user,
        precision=2  # 2 decimal places
    )

    await db.update_document_custom_field_values(
        db_session,
        document_id=doc1.id,
        custom_fields={"Amount": "2999.85"}
    )

    await db.update_document_custom_field_values(
        db_session,
        document_id=doc2.id,
        custom_fields={"Amount": "19.05"}
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            categories=[
                search_schema.CategoryFilter(
                    values=["Invoice"]
                )
            ],
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Amount",
                    operator=search_schema.CustomFieldOperator.GT,
                    value=100
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG,
    )
    # search for bills with total > 100
    results = await db.search_documents(
        db_session=db_session,
        user_id=user.id,
        params=params,
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc1.id
    assert results.items[0].title == "large-bill.pdf"

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            categories=[
                search_schema.CategoryFilter(
                    values=["Invoice"]
                )
            ],
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Amount",
                    operator=search_schema.CustomFieldOperator.LT,
                    value=100
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG,
    )
    # search for bills with total < 100
    results = await db.search_documents(
        db_session=db_session,
        user_id=user.id,
        params=params,
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc2.id
    assert results.items[0].title == "tiny-bill.pdf"


async def test_filter_documents_by_multiple_cf(
    db_session: AsyncSession,
    user,
    make_document_type_with_custom_fields,
    make_document
):
    doc_1 = await make_document(
        title="doc_1.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_2 = await make_document(
        title="doc_2.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc_3 = await make_document(
        title="doc_3.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    invoice_type = await make_document_type_with_custom_fields(
        name="Invoice",
        custom_fields=[
            {"name": "Invoice Date", "type_handler": "date"},
            {"name": "Vendor", "type_handler": "text"},
            {
                "name": "Total Amount", "type_handler": "monetary",
                "config": {"currency": "EUR"}
            },
        ]
    )
    for doc in [doc_1, doc_2, doc_3]:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=invoice_type.id
        )

    await db.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={
            "Total Amount": "19.05",
            "Vendor": "lidl",
            "Invoice Date": "2024-12-15"
        }
    )
    await db.update_document_custom_field_values(
        db_session,
        document_id=doc_2.id,
        custom_fields={
            "Total Amount": "59.05",
            "Vendor": "lidl",
            "Invoice Date": "2024-12-16"
        }
    )
    await db.update_document_custom_field_values(
        db_session,
        document_id=doc_3.id,
        custom_fields={
            "Total Amount": "69.00",
            "Vendor": "rewe",
            "Invoice Date": "2024-12-17"
        }
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            categories=[
                search_schema.CategoryFilter(
                    values=["Invoice"]
                )
            ],
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Total Amount",
                    operator=search_schema.CustomFieldOperator.GT,
                    value=30
                ),
                search_schema.CustomFieldFilter(
                    field_name="Vendor",
                    operator=search_schema.CustomFieldOperator.EQ,
                    value="lidl"
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG,
    )

    # search for receipts with total amount > 30 and vendor = "lidl"
    results = await db.search_documents(
        db_session=db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc_2.id
    assert results.items[0].title == "doc_2.pdf"



async def test_filter_and_sort_documents_by_multiple_cf(
    db_session: AsyncSession,
    user,
    make_document_type_with_custom_fields,
    make_document
):
    docs = []
    for index in range(0, 10):
        doc = await make_document(
            title=f"doc_{index}.pdf",
            user=user,
            parent=user.home_folder,
            lang=search_schema.SearchLanguage.ENG
        )
        docs.append(doc)

    invoice_type = await make_document_type_with_custom_fields(
        name="Invoice",
        custom_fields=[
            {"name": "Invoice Date", "type_handler": "date"},
            {"name": "Vendor", "type_handler": "text"},
            {
                "name": "Total Amount", "type_handler": "monetary",
                "config": {"currency": "EUR"}
            },
        ]
    )
    for doc in docs:
        await doc_dbapi.update_doc_type(
            db_session,
            document_id=doc.id,
            document_type_id=invoice_type.id
        )

    Invoice = namedtuple(
        'Invoice',
        ['index', 'total_amount', 'vendor', 'invoice_date']
    )

    values = [
        Invoice(0, "29.05", "lidl", "2024-12-15"),
        Invoice(1, "9.0", "lidl", "2024-12-16"),
        Invoice(2, "17.25", "lidl", "2024-06-13"),
        Invoice(3, "49.05", "lidl", "2024-05-11"),
        Invoice(4, "21.03", "lidl", "2024-04-10"),
        Invoice(5, "19.05", "lidl", "2024-12-15"),
        Invoice(6, "9.0", "rewe", "2024-11-16"),
        Invoice(7, "17.25", "rewe", "2024-11-13"),
        Invoice(8, "49.05", "aldi", "2024-11-11"),
        Invoice(9, "21.03", "rewe", "2024-08-18"),
    ]

    for value in values:
        await db.update_document_custom_field_values(
            db_session,
            document_id=docs[value.index].id,
            custom_fields={
                "Total Amount": value.total_amount,
                "Vendor": value.vendor,
                "Invoice Date": value.invoice_date
            }
        )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            categories=[
                search_schema.CategoryFilter(
                    values=["Invoice"]
                )
            ],
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Total Amount",
                    operator=search_schema.CustomFieldOperator.GT,
                    value=20
                ),
                search_schema.CustomFieldFilter(
                    field_name="Vendor",
                    operator=search_schema.CustomFieldOperator.EQ,
                    value="lidl"
                )
            ]
        ),
        sort_by="Total Amount",
        sort_direction=search_schema.SortDirection.DESC,
        lang=search_schema.SearchLanguage.ENG,
    )

    results = await db.search_documents(
        db_session=db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 3
    actual_document_ids = [doc.id for doc in results.items]
    # 1. doc with amount 49.05
    # 2. doc with amount 29.05
    # 3. doc with amount 21.03
    assert actual_document_ids == [docs[3].id, docs[0].id, docs[4].id]


@pytest.mark.parametrize(
    "valid_lower_value, valid_upper_value",
    [
        ("30", 60),
        (30, 60),
        (0, 60),
        ("0", 60),
        ("49.95", 60),
        (49.95, 60),
        ("59.04", "59.06"),
        (59.04, 59.06)
    ],
)
async def test_filter_by_monetary_custom_field_valid_values(
    valid_lower_value,
    valid_upper_value,
    db_session: AsyncSession,
    user,
    make_document_type_with_custom_fields,
    make_document
):
    """
    In this scenario filter gets valid values as different data types
    str, int etc
    """
    doc = await make_document(
        title="Doc Title",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    invoice_type = await make_document_type_with_custom_fields(
        name="Invoice",
        custom_fields=[
            {"name": "Invoice Date", "type_handler": "date"},
            {"name": "Vendor", "type_handler": "text"},
            {
                "name": "Total Amount", "type_handler": "monetary",
                "config": {"currency": "EUR"}
            },
        ]
    )
    await doc_dbapi.update_doc_type(
        db_session,
        document_id=doc.id,
        document_type_id=invoice_type.id
    )
    await db.update_document_custom_field_values(
        db_session,
        document_id=doc.id,
        custom_fields={
            "Total Amount": "59.05",
            "Vendor": "lidl",
            "Invoice Date": "2024-12-16"
        }
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            categories=[
                search_schema.CategoryFilter(
                    values=["Invoice"]
                )
            ],
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Total Amount",
                    operator=search_schema.CustomFieldOperator.GT,
                    value=valid_lower_value
                ),
                search_schema.CustomFieldFilter(
                    field_name="Total Amount",
                    operator=search_schema.CustomFieldOperator.LT,
                    value=valid_upper_value
                )
            ],
        ),
        lang=search_schema.SearchLanguage.ENG,
    )

    results = await db.search_documents(
        db_session=db_session,
        user_id=user.id,
        params=params,
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc.id
    assert results.items[0].title == "Doc Title"


@pytest.mark.parametrize(
    "invalid_search_cf_value",
    ["-","coco", "this is not a monetary value", ""],
)
async def test_filter_by_monetary_custom_field_invalid_values(
    invalid_search_cf_value,
    db_session: AsyncSession,
    user,
    make_document_type_with_custom_fields,
    make_document
):
    """
    In this scenario filter gets invalid values as different data types
    str, int etc
    """
    invoice_type = await make_document_type_with_custom_fields(
        name="Invoice",
        custom_fields=[
            {"name": "Invoice Date", "type_handler": "date"},
            {"name": "Vendor", "type_handler": "text"},
            {
                "name": "Total Amount", "type_handler": "monetary",
                "config": {"currency": "EUR"}
            },
        ]
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            categories=[
                search_schema.CategoryFilter(
                    values=["Invoice"]
                )
            ],
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Total Amount",
                    operator=search_schema.CustomFieldOperator.GT,
                    value=invalid_search_cf_value
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG,
    )

    with pytest.raises(ValueError):
        await db.search_documents(
            db_session=db_session,
            user_id=user.id,
            params=params,
        )
