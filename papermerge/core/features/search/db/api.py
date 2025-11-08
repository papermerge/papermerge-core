import logging
import math
from uuid import UUID

from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.document.db import orm as doc_orm
from papermerge.core.features.search import schema
from papermerge.core.features.search.db.orm import DocumentSearchIndex
from papermerge.core.features.custom_fields.db.orm import CustomField, \
    CustomFieldValue
from papermerge.core.features.document_types.db.orm import DocumentType
from papermerge.core.features.groups.db.orm import UserGroup
from papermerge.core.types import OwnerType
from papermerge.core.features.custom_fields.cf_types.registry import \
    TypeRegistry

logger = logging.getLogger(__name__)


async def search_documents_by_type(
    db_session: AsyncSession,
    document_type_id: UUID,
    *,
    user_id: UUID,
    params: schema.SearchQueryParams,
) -> schema.SearchDocumentsByTypeResponse:
    """
    Search documents within a SPECIFIC document type with custom field filtering/sorting.

    This function is similar to /documents/type/{document_type_id}/ endpoint.
    It searches only within documents of the specified type and can:
    - Filter and sort by custom fields
    - Apply FTS filter
    - Apply tag filters
    - Return custom field metadata and values

    Args:
        db_session: AsyncSession for database operations
        user_id: UUID of the current user (for access control)

    Returns:
        SearchDocumentsByTypeResponse with DocumentCFV items and custom field metadata
    """

    if not document_type_id:
        raise ValueError("document_type_id is required for this search type")

    # =======================================================================
    # STEP 1: Get custom fields for this document type
    # ================================================================== =====
    stmt_cf = (
        select(CustomField)
        .join(
            DocumentType.custom_fields
        )
        .where(DocumentType.id == document_type_id)
    )

    result_cf = await db_session.execute(stmt_cf)
    custom_fields = result_cf.scalars().all()

    custom_fields_info = [
        schema.CustomFieldInfo(
            id=cf.id,
            name=cf.name,
            type_handler=cf.type_handler,
            config=cf.config or {}
        )
        for cf in custom_fields
    ]

    # =========================================================================
    # STEP 2: Build base query for documents with this document type
    # =========================================================================
    base_query = select(DocumentSearchIndex)
    count_query = select(func.count(DocumentSearchIndex.document_id))

    # Filter by document type
    type_filter = DocumentSearchIndex.document_type_id == document_type_id

    # Access control: user + groups
    user_groups_subquery = select(UserGroup.group_id).where(
        UserGroup.user_id == user_id
    )

    access_filter = or_(
        and_(
            DocumentSearchIndex.owner_type == OwnerType.USER.value,
            DocumentSearchIndex.owner_id == user_id
        ),
        and_(
            DocumentSearchIndex.owner_type == OwnerType.GROUP.value,
            DocumentSearchIndex.owner_id.in_(user_groups_subquery)
        )
    )

    base_query = base_query.where(and_(type_filter, access_filter))
    count_query = count_query.where(and_(type_filter, access_filter))

    # =========================================================================
    # STEP 3: Apply FTS filter
    # =========================================================================
    if params.filters.fts:
        fts_query = _build_fts_query(params.filters.fts, params.lang or 'eng')
        base_query = base_query.where(fts_query)
        count_query = count_query.where(fts_query)

    # =========================================================================
    # STEP 4: Apply tag filters
    # =========================================================================
    if params.filters.tags:
        tag_filters = _build_tag_filters(params.filters.tags)
        if tag_filters:
            base_query = base_query.where(tag_filters)
            count_query = count_query.where(tag_filters)

    # =========================================================================
    # STEP 5: Apply custom field filters
    # =========================================================================
    if params.filters.custom_fields:
        for filter_spec in params.filters.custom_fields:
            # Find custom field by name
            cf = next((f for f in custom_fields if f.name == filter_spec.field_name), None)
            if not cf:
                logger.warning(f"Custom field '{filter_spec.field_name}' not found for document type")
                continue

            # Get handler and build filter
            handler = TypeRegistry.get_handler(cf.type_handler)
            cfv_alias = aliased(CustomFieldValue)
            sort_column = getattr(cfv_alias, handler.get_sort_column())
            config = handler.parse_config(cf.config or {})

            filter_expr = handler.get_filter_expression(
                sort_column,
                filter_spec.operator,
                filter_spec.value,
                config
            )

            # Join with custom field values
            base_query = base_query.join(
                cfv_alias,
                and_(
                    cfv_alias.document_id == DocumentSearchIndex.document_id,
                    cfv_alias.field_id == cf.id,
                    filter_expr
                )
            )
            count_query = count_query.join(
                cfv_alias,
                and_(
                    cfv_alias.document_id == DocumentSearchIndex.document_id,
                    cfv_alias.field_id == cf.id,
                    filter_expr
                )
            )

    # =========================================================================
    # STEP 6: Apply sorting
    # =========================================================================
    base_query = _apply_sorting_with_custom_fields(
        base_query,
        params,
        custom_fields
    )

    # =========================================================================
    # STEP 7: Apply pagination
    # =========================================================================
    offset = (params.page_number - 1) * params.page_size
    base_query = base_query.limit(params.page_size).offset(offset)

    # =========================================================================
    # STEP 8: Execute queries
    # =========================================================================
    result = await db_session.execute(base_query)
    search_results = result.scalars().all()

    count_result = await db_session.execute(count_query)
    total_count = count_result.scalar()

    # =========================================================================
    # STEP 9: Load custom field values for each document
    # =========================================================================
    items = []
    for row in search_results:
        # Get custom field values for this document
        stmt_cfv = (
            select(CustomFieldValue)
            .where(CustomFieldValue.document_id == row.document_id)
        )
        result_cfv = await db_session.execute(stmt_cfv)
        cfv_list = result_cfv.scalars().all()

        # Build custom field rows
        cf_rows = []
        for cf in custom_fields:
            cfv = next((v for v in cfv_list if v.field_id == cf.id), None)

            cf_rows.append(
                schema.CustomFieldRow(
                    custom_field=schema.CustomFieldShort(
                        id=cf.id,
                        name=cf.name,
                        type_handler=cf.type_handler,
                        config=cf.config or {}
                    ),
                    custom_field_value=schema.CustomFieldValueShort(
                        value=cfv.value if cfv else None,
                        value_text=cfv.value_text if cfv else None,
                        value_numeric=cfv.value_numeric if cfv else None,
                        value_date=cfv.value_date if cfv else None,
                        value_datetime=cfv.value_datetime if cfv else None,
                        value_boolean=cfv.value_boolean if cfv else None
                    ) if cfv else None
                )
            )

        items.append(
            schema.DocumentCFV(
                document_id=row.document_id,
                title=row.title,
                document_type_id=row.document_type_id,
                document_type_name=row.document_type_name,
                tags=row.tags or [],
                custom_fields=cf_rows,
                lang=row.lang,
                last_updated=row.last_updated
            )
        )

    num_pages = math.ceil(total_count / params.page_size)

    return schema.SearchDocumentsByTypeResponse(
        items=items,
        page_number=params.page_number,
        page_size=params.page_size,
        num_pages=num_pages,
        total_items=total_count,
        custom_fields=custom_fields_info,
        document_type_id=document_type_id
    )


async def search_documents(
    db_session: AsyncSession,
    *,
    user_id: UUID,
    params: schema.SearchQueryParams
) -> schema.SearchDocumentsResponse:
    """
    Search documents across ALL accessible document types.

    This function is similar to /documents/ endpoint.
    It searches across all documents the user has access to and can:
    - Filter by categories (one or multiple)
    - Apply FTS filter
    - Apply tag filters
    - NO custom field filtering (since documents may have different types)
    - Returns flat document list without custom field values

    Args:
        db_session: AsyncSession for database operations
        user_id: UUID of the current user (for access control)
        params: SearchQueryParams without document_type_id

    Returns:
        SearchDocumentsResponse with FlatDocument items (no custom fields)
    """

    if params.document_type_id:
        raise ValueError("document_type_id should not be provided for general search")

    # Ignore custom fields filter when no document_type_id
    if params.filters.custom_fields:
        logger.warning("custom_fields filter ignored when document_type_id is not provided")

    # =========================================================================
    # STEP 1: Build base query
    # =========================================================================
    base_query = select(DocumentSearchIndex)
    count_query = select(func.count(DocumentSearchIndex.document_id))

    # Access control: user + groups
    user_groups_subquery = select(UserGroup.group_id).where(
        UserGroup.user_id == user_id
    )

    access_filter = or_(
        and_(
            DocumentSearchIndex.owner_type == OwnerType.USER.value,
            DocumentSearchIndex.owner_id == user_id
        ),
        and_(
            DocumentSearchIndex.owner_type == OwnerType.GROUP.value,
            DocumentSearchIndex.owner_id.in_(user_groups_subquery)
        )
    )

    base_query = base_query.where(access_filter)
    count_query = count_query.where(access_filter)

    # =========================================================================
    # STEP 2: Apply FTS filter
    # =========================================================================
    if params.filters.fts:
        fts_query = _build_fts_query(params.filters.fts, params.lang or 'eng')
        base_query = base_query.where(fts_query)
        count_query = count_query.where(fts_query)

    # =========================================================================
    # STEP 3: Apply category filter
    # =========================================================================
    if params.filters.category:
        category_filter = _build_category_filter(params.filters.category)
        base_query = base_query.where(category_filter)
        count_query = count_query.where(category_filter)

    # =========================================================================
    # STEP 4: Apply tag filters
    # =========================================================================
    if params.filters.tags:
        tag_filters = _build_tag_filters(params.filters.tags)
        if tag_filters is not None:
            base_query = base_query.where(tag_filters)
            count_query = count_query.where(tag_filters)

    # =========================================================================
    # STEP 5: Apply sorting (no custom fields)
    # =========================================================================
    base_query = _apply_sorting_simple(base_query, params)

    # =========================================================================
    # STEP 6: Apply pagination
    # =========================================================================
    offset = (params.page_number - 1) * params.page_size
    base_query = base_query.limit(params.page_size).offset(offset)

    # =========================================================================
    # STEP 7: Execute queries
    # =========================================================================
    result = await db_session.execute(base_query)
    search_results = result.scalars().all()

    count_result = await db_session.execute(count_query)
    total_count = count_result.scalar()

    # =========================================================================
    # STEP 8: Convert to flat documents (no custom field values)
    # =========================================================================
    items = [
        schema.FlatDocument(
            document_id=row.document_id,
            title=row.title,
            document_type_id=row.document_type_id,
            document_type_name=row.document_type_name,
            tags=row.tags or [],
            lang=row.lang,
            last_updated=row.last_updated
        )
        for row in search_results
    ]

    num_pages = math.ceil(total_count / params.page_size)

    return schema.SearchDocumentsResponse(
        items=items,
        page_number=params.page_number,
        page_size=params.page_size,
        num_pages=num_pages,
        total_items=total_count,
    )


# ============================================================================
# Helper functions
# ============================================================================

def _build_fts_query(fts_filter: schema.FullTextSearchFilter, lang: str):
    """Build full-text search query with support for AND/OR logic."""
    lang_config_map = {
        'deu': 'german',
        'eng': 'english',
        'fra': 'french',
        'spa': 'spanish',
        'ita': 'italian',
        'por': 'portuguese',
        'rus': 'russian',
        'nld': 'dutch',
    }

    lang_config = lang_config_map.get(lang, 'simple')
    query_str = ' & '.join(fts_filter.terms)

    # Use plainto_tsquery or to_tsquery depending on complexity
    if '|' in query_str or '(' in query_str:
        ts_query = func.to_tsquery(lang_config, query_str)
    else:
        ts_query = func.plainto_tsquery(lang_config, query_str)

    # Use @@ operator directly instead of .match() to avoid double wrapping
    return DocumentSearchIndex.search_vector.op('@@')(ts_query)


def _build_category_filter(category_filter: schema.CategoryFilter):
    """Build category filter using ILIKE for flexible matching."""
    conditions = []

    for value in category_filter.values:
        conditions.append(
            DocumentSearchIndex.document_type_name.ilike(f'%{value}%')
        )

    # OR logic: match any of the specified categories
    return or_(*conditions)


def _build_tag_filters(tag_filters: list[schema.TagFilter]):
    """Build tag filters with positive and negative matching."""
    conditions = []

    for tag_filter in tag_filters:
        if tag_filter.tags_any:
            tag_conditions = [
                DocumentSearchIndex.tags.contains([tag])
                for tag in tag_filter.tags_any
            ]
            conditions.append(or_(*tag_conditions))

        if tag_filter.tags:
            tag_conditions = [
                DocumentSearchIndex.tags.contains([tag])
                for tag in tag_filter.tags
            ]
            conditions.append(and_(*tag_conditions))

        # Negative tags (none should be present)
        if tag_filter.tags_not:
            tag_conditions = []
            for tag in tag_filter.tags_not:
                tag_conditions.append(
                    ~DocumentSearchIndex.tags.contains([tag])
                )
            conditions.append(and_(*tag_conditions))

    return and_(*conditions) if conditions else None


def _apply_sorting_simple(query, params: schema.SearchQueryParams):
    """Apply sorting without custom fields (for general search)."""
    sort_column_map = {
        schema.SortBy.ID: DocumentSearchIndex.document_id,
        schema.SortBy.TITLE: DocumentSearchIndex.title,
        schema.SortBy.CATEGORY: DocumentSearchIndex.document_type_name,
        schema.SortBy.UPDATED_AT: DocumentSearchIndex.last_updated,
    }

    sort_column = sort_column_map.get(params.sort_by, DocumentSearchIndex.last_updated)

    if params.sort_direction == schema.SortDirection.DESC:
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    return query


def _apply_sorting_with_custom_fields(
        query,
        params: schema.SearchQueryParams,
        custom_fields: list[CustomField]
):
    """Apply sorting with custom field support (for document type search)."""

    # Check if sorting by custom field
    if params.sort_by and isinstance(params.sort_by, str):
        # Try to find custom field with this name
        cf = next((f for f in custom_fields if f.name == params.sort_by), None)
        if cf:
            # Sort by custom field
            handler = TypeRegistry.get_handler(cf.type_handler)
            cfv_alias = aliased(CustomFieldValue)
            sort_column = getattr(cfv_alias, handler.get_sort_column())

            # Join with custom field values for sorting
            query = query.outerjoin(
                cfv_alias,
                and_(
                    cfv_alias.document_id == DocumentSearchIndex.document_id,
                    cfv_alias.field_id == cf.id
                )
            )

            if params.sort_direction == schema.SortDirection.DESC:
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())

            return query

    # Default sorting (same as simple)
    return _apply_sorting_simple(query, params)


async def rebuild_document_search_index(
    db_session: AsyncSession,
) -> int:
    """
    Rebuild the entire DocumentSearchIndex by calling the PostgreSQL
    upsert_document_search_index function for all documents.

    This function:
    1. Clears the existing search index
    2. Gets all document IDs from the database
    3. Calls the PostgreSQL upsert function for each document

    The PostgreSQL function handles:
    - Computing tsvector from title, tags, document type, and custom fields
    - Applying proper language configuration
    - Managing ownership/access control data

    Args:
        db_session: AsyncSession for database operations

    Returns:
        int: Number of documents indexed

    Example:
        ```python
        from papermerge.core.db.engine import AsyncSessionLocal
        from papermerge.core import dbapi

        async with AsyncSessionLocal() as db_session:
            count = await dbapi.rebuild_document_search_index(db_session)
            print(f"Indexed {count} documents")
        ```
    """
    logger.info("Starting full rebuild of document search index")

    # Step 1: Clear existing index
    await db_session.execute(
        text("DELETE FROM document_search_index")
    )
    await db_session.commit()
    logger.info("Cleared existing search index")

    # Step 2: Get all document IDs
    stmt = select(doc_orm.Document.id)
    result = await db_session.execute(stmt)
    document_ids = result.scalars().all()

    total_docs = len(document_ids)
    logger.info(f"Found {total_docs} documents to index")

    # Step 3: Call upsert function for each document
    indexed_count = 0
    failed_count = 0

    for doc_id in document_ids:
        try:
            # Call PostgreSQL function to upsert this document
            await db_session.execute(
                text("SELECT upsert_document_search_index(:doc_id)"),
                {"doc_id": doc_id}
            )
            indexed_count += 1

            # Commit every 100 documents to avoid long transactions
            if indexed_count % 100 == 0:
                await db_session.commit()
                logger.info(f"Indexed {indexed_count}/{total_docs} documents")

        except Exception as e:
            logger.error(
                f"Error indexing document {doc_id}: {e}",
                exc_info=True
            )
            failed_count += 1
            # Continue with next document
            continue

    # Final commit
    await db_session.commit()

    logger.info(
        f"Completed index rebuild: {indexed_count} succeeded, "
        f"{failed_count} failed out of {total_docs} total"
    )

    return indexed_count


async def index_specific_documents(
    db_session: AsyncSession,
    document_ids: list[UUID],
) -> int:
    """
    Rebuild search index for specific documents by their IDs.

    This is useful when you want to reindex only certain documents
    instead of the entire database. The PostgreSQL upsert function
    will be called for each document.

    Args:
        db_session: AsyncSession for database operations
        document_ids: List of document UUIDs to index

    Returns:
        int: Number of documents successfully indexed

    Example:
        ```python
        from uuid import UUID
        from papermerge.core.db.engine import AsyncSessionLocal
        from papermerge.core import dbapi

        doc_ids = [
            UUID('123e4567-e89b-12d3-a456-426614174000'),
            UUID('223e4567-e89b-12d3-a456-426614174001'),
        ]

        async with AsyncSessionLocal() as db_session:
            count = await dbapi.index_specific_documents(db_session, doc_ids)
            print(f"Indexed {count} documents")
        ```
    """
    if not document_ids:
        logger.warning("No document IDs provided for indexing")
        return 0

    logger.info(f"Indexing {len(document_ids)} specific documents")

    indexed_count = 0
    failed_count = 0

    for doc_id in document_ids:
        try:
            # Call PostgreSQL function to upsert this document
            await db_session.execute(
                text("SELECT upsert_document_search_index(:doc_id)"),
                {"doc_id": doc_id}
            )
            indexed_count += 1

        except Exception as e:
            logger.error(
                f"Error indexing document {doc_id}: {e}",
                exc_info=True
            )
            failed_count += 1
            # Continue with next document
            continue

    # Commit all changes
    await db_session.commit()

    logger.info(
        f"Indexed {indexed_count} succeeded, {failed_count} failed "
        f"out of {len(document_ids)} requested"
    )

    return indexed_count


async def get_document_search_index_stats(
    db_session: AsyncSession,
) -> dict:
    """
    Get statistics about the document search index.

    Returns information about:
    - Total documents in the system
    - Total documents in the search index
    - Documents missing from the index
    - Index size information

    Args:
        db_session: AsyncSession for database operations

    Returns:
        dict: Statistics about the search index

    Example:
        ```python
        async with AsyncSessionLocal() as db_session:
            stats = await dbapi.get_document_search_index_stats(db_session)
            print(f"Total documents: {stats['total_documents']}")
            print(f"Indexed documents: {stats['indexed_documents']}")
            print(f"Missing from index: {stats['missing_from_index']}")
        ```
    """
    # Get total document count
    stmt = select(text("COUNT(*)")).select_from(doc_orm.Document)
    result = await db_session.execute(stmt)
    total_documents = result.scalar()

    # Get indexed document count
    stmt_indexed = text("SELECT COUNT(*) FROM document_search_index")
    result_indexed = await db_session.execute(stmt_indexed)
    indexed_documents = result_indexed.scalar()

    # Calculate missing documents
    missing_from_index = total_documents - indexed_documents

    # Get index size (PostgreSQL specific)
    try:
        size_query = text("""
            SELECT pg_size_pretty(pg_total_relation_size('document_search_index'))
        """)
        result_size = await db_session.execute(size_query)
        index_size = result_size.scalar()
    except Exception as e:
        logger.warning(f"Could not get index size: {e}")
        index_size = "unknown"

    return {
        "total_documents": total_documents,
        "indexed_documents": indexed_documents,
        "missing_from_index": missing_from_index,
        "index_size": index_size,
    }


async def find_unindexed_documents(
    db_session: AsyncSession,
) -> list[UUID]:
    """
    Find documents that exist in the database but are missing from the search index.

    This can happen if:
    - The index was manually cleared
    - Database triggers were disabled
    - There were errors during indexing

    Args:
        db_session: AsyncSession for database operations

    Returns:
        list[UUID]: List of document IDs that are not in the search index

    Example:
        ```python
        async with AsyncSessionLocal() as db_session:
            missing_ids = await dbapi.find_unindexed_documents(db_session)
            if missing_ids:
                print(f"Found {len(missing_ids)} unindexed documents")
                # Reindex them
                await dbapi.index_specific_documents(db_session, missing_ids)
        ```
    """
    query = text("""
        SELECT d.node_id
        FROM documents d
        LEFT JOIN document_search_index dsi ON dsi.document_id = d.node_id
        WHERE dsi.document_id IS NULL
    """)

    result = await db_session.execute(query)
    unindexed_ids = [row[0] for row in result]

    logger.info(f"Found {len(unindexed_ids)} documents missing from search index")

    return unindexed_ids


async def extract_document_type_from_category(
    db_session: AsyncSession,
    params: schema.SearchQueryParams
) -> UUID | None:
    """
    Extract document type ID from category filter.

    Returns document type ID if exactly one category is specified,
    otherwise returns None.
    """
    # Check if category filter exists and has exactly one value
    if not params.filters.category:
        return None

    if len(params.filters.category.values) != 1:
        return None

    # Get the single category name
    category_name = params.filters.category.values[0]

    stmt = select(DocumentType).where(DocumentType.name == category_name)
    result = await db_session.execute(stmt)
    document_type = result.scalar_one_or_none()

    if document_type is None:
        logger.warning(f"Document type not found for category: {category_name}")
        return None

    return document_type.id
