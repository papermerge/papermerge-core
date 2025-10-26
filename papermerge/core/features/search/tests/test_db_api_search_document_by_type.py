from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.search.db import api as search_dbapi
from papermerge.core.features.custom_fields.db import api as cf_dbapi


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
