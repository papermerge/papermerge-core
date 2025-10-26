from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.search.db import api as search_dbapi
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.document.db import api as doc_dbapi


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

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc1.id,
        custom_fields={"Amount": "2999.85"}
    )

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc2.id,
        custom_fields={"Amount": "19.05"}
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Amount",
                    operator=search_schema.Operator.GT,
                    value=100
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG,
        document_type_id=doc1.document_type_id,
    )
    # search for bills with total > 100
    results = await search_dbapi.search_documents_by_type(
        db_session=db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].document_id == doc1.id
    assert results.items[0].title == "large-bill.pdf"

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Amount",
                    operator=search_schema.Operator.LT,
                    value=100
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG,
        document_type_id=doc1.document_type_id,
    )
    # search for bills with total < 100
    results = await search_dbapi.search_documents_by_type(
        db_session=db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].document_id == doc2.id
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

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_1.id,
        custom_fields={
            "Total Amount": "19.05",
            "Vendor": "lidl",
            "Invoice Date": "2024-12-15"
        }
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc_2.id,
        custom_fields={
            "Total Amount": "59.05",
            "Vendor": "lidl",
            "Invoice Date": "2024-12-16"
        }
    )
    await cf_dbapi.update_document_custom_field_values(
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
            custom_fields=[
                search_schema.CustomFieldFilter(
                    field_name="Total Amount",
                    operator=search_schema.Operator.GT,
                    value=30
                ),
                search_schema.CustomFieldFilter(
                    field_name="Vendor",
                    operator=search_schema.Operator.EQ,
                    value="lidl"
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG,
        document_type_id=invoice_type.id,
    )

    # search for receipts with total amount > 30 and vendor = "lidl"
    results = await search_dbapi.search_documents_by_type(
        db_session=db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].document_id == doc_2.id
    assert results.items[0].title == "doc_2.pdf"

