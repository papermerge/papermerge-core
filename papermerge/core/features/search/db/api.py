import logging
import math
from uuid import UUID

from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.search import schema
from papermerge.core.features.search.db.orm import DocumentSearchIndex
from papermerge.core.features.custom_fields.db.orm import CustomField, CustomFieldValue
from papermerge.core.features.document_types.db.orm import DocumentType
from papermerge.core.features.groups.db.orm import UserGroup
from papermerge.core.types import OwnerType
from papermerge.core.features.custom_fields.cf_types.registry import TypeRegistry

logger = logging.getLogger(__name__)


async def search_documents_by_type(
    db_session: AsyncSession,
    *,
    user_id: UUID,
    params: schema.SearchQueryParams
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
        params: SearchQueryParams with document_type_id specified

    Returns:
        SearchDocumentsByTypeResponse with DocumentCFV items and custom field metadata
    """

    if not params.document_type_id:
        raise ValueError("document_type_id is required for this search type")

    # Ignore category filter when document_type_id is provided
    if params.filters.category:
        logger.warning("category filter ignored when document_type_id is provided")

    # =======================================================================
    # STEP 1: Get custom fields for this document type
    # ================================================================== =====
    stmt_cf = (
        select(CustomField)
        .join(
            DocumentType.custom_fields
        )
        .where(DocumentType.id == params.document_type_id)
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
    type_filter = DocumentSearchIndex.document_type_id == params.document_type_id

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
        custom_fields=custom_fields_info
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
        total_items=total_count
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
