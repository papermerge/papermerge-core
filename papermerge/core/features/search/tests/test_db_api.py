from sqlalchemy.ext.asyncio import AsyncSession
from papermerge.core.features.search.db import api as search_dbapi
from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.search.db.orm import DocumentSearchIndex
from sqlalchemy import select


async def test_search_documents(
    db_session: AsyncSession,
    make_document,
    user
):
    doc = await make_document(
        title="this is title with basic note.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    await db_session.commit()

    stmt = select(DocumentSearchIndex).where(
        DocumentSearchIndex.document_id == doc.id
    )
    result = await db_session.execute(stmt)
    index_entry = result.scalar_one_or_none()

    assert index_entry is not None, "Search index was not populated"
    assert "note" in index_entry.title.lower()

    fts = search_schema.FullTextSearchFilter(terms=["note"])
    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            fts=fts
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    results =await search_dbapi.search_documents(
        db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].document_id == doc.id

