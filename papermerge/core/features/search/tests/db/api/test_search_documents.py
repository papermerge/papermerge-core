from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.search.db import api as search_dbapi
from papermerge.core.features.search import schema as search_schema
from papermerge.core.features.nodes.db import api as nodes_dbapi


async def test_fts_search_documents_basic_text_in_title(
    db_session: AsyncSession,
    make_document,
    user
):
    """
    Document (D) title contains "notes.pdf".
    User searches by "note" -> document D is found.
    """
    await make_document(
        title="some-document-2.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc = await make_document(
        title="this is title with basic notes.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    fts = search_schema.FullTextSearchFilter(terms=["note"])
    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            fts=fts,
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    results =await search_dbapi.search_documents(
        db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc.id


async def test_fts_search_documents_two_terms_text_in_title(
    db_session: AsyncSession,
    make_document,
    user
):
    """
    Document (D) title contains "meeting on thursday with many details.pdf".
    User searches by "meeting details" -> document D is found.
    """
    await make_document(
        title="some-document-2.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc = await make_document(
        title="meeting on thursday with many details.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    await make_document(
        title="general meeting on monday.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )

    fts = search_schema.FullTextSearchFilter(terms=["meeting", "details"])
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
    assert results.items[0].id == doc.id


async def test_search_documents_by_one_tag(
    db_session: AsyncSession,
    make_document,
    make_tag,
    user
):
    await make_document(
        title="some-document-2.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc = await make_document(
        title="needle.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    await make_tag(
        name="green",
        user=user
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=doc.id,
        tags=["green"],
        created_by=user.id
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            tags=[
                search_schema.TagFilter(
                    values=["green"]
            )   ]
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    results =await search_dbapi.search_documents(
        db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc.id


async def test_search_documents_that_has_all_tags(
    db_session: AsyncSession,
    make_document,
    make_tag,
    user
):
    """
    Only document "needle.pdf" has two tags associated "blue" and "green".
    User searches for the documents containing BOTH tags "blue" AND "green" ->
    document "needle.pdf" will be found.
    """
    d2 = await make_document(
        title="some-document-2.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    d1 = await make_document(
        title="some-document-1.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc = await make_document(
        title="needle.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    await make_tag(
        name="green",
        user=user
    )
    await make_tag(
        name="blue",
        user=user
    )
    # this is the only document containing both tags
    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=doc.id,
        tags=["green", "blue"],
        created_by=user.id
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=d1.id,
        tags=["green"],
        created_by=user.id
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=d2.id,
        tags=["blue"],
        created_by=user.id
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            tags=[
                search_schema.TagFilter(
                    values=["green", "blue"]
            )   ]
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    results =await search_dbapi.search_documents(
        db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc.id


async def test_search_documents_that_has_any_tags(
    db_session: AsyncSession,
    make_document,
    make_tag,
    user
):
    """
    d1, dblue(blue), doc(blue, green).
    tags_any:green, blue -> doc, d2
    """
    dblue = await make_document(
        title="some-document-2.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    d1 = await make_document(
        title="some-document-1.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc = await make_document(
        title="needle.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    await make_tag(
        name="green",
        user=user
    )
    await make_tag(
        name="blue",
        user=user
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=doc.id,
        tags=["green", "blue"],
        created_by=user.id
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=dblue.id,
        tags=["blue"],
        created_by=user.id
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            tags=[
                search_schema.TagFilter(
                    values=["green", "blue"],
                    operator=search_schema.TagOperator.ANY
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    results = await search_dbapi.search_documents(
        db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 2
    found_document_ids = {doc.id for doc in results.items}
    assert found_document_ids == {doc.id, dblue.id}


async def test_tags_not(
    db_session: AsyncSession,
    make_document,
    make_tag,
    user
):
    """
    tags_not: ["deleted", "archived"] means
    all documents that don't have either "deleted" nor "archived".
    Example: d1(deleted), d2(archived), doc(green).

    tags_not: ["deleted", "archived"] -> doc
    """
    d2 = await make_document(
        title="some-document-2.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    d1 = await make_document(
        title="some-document-1.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    doc = await make_document(
        title="needle.pdf",
        user=user,
        parent=user.home_folder,
        lang=search_schema.SearchLanguage.ENG
    )
    await make_tag(
        name="deleted",
        user=user
    )
    await make_tag(
        name="archived",
        user=user
    )
    await make_tag(
        name="green",
        user=user
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=doc.id,
        tags=["green"],
        created_by=user.id
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=d1.id,
        tags=["deleted"],
        created_by=user.id
    )

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=d2.id,
        tags=["archived"],
        created_by=user.id
    )

    params = search_schema.SearchQueryParams(
        filters=search_schema.SearchFilters(
            tags=[
                search_schema.TagFilter(
                    values=["deleted", "archived"],
                    operator=search_schema.TagOperator.NOT
                )
            ]
        ),
        lang=search_schema.SearchLanguage.ENG
    )

    results = await search_dbapi.search_documents(
        db_session,
        user_id=user.id,
        params=params
    )

    assert len(results.items) == 1
    assert results.items[0].id == doc.id
