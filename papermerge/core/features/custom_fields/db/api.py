import math
import logging
import uuid
from typing import Optional, Dict, Any

from pydantic import ValidationError
from sqlalchemy import select, func, or_, and_, asc, desc, delete
from sqlalchemy.orm import aliased
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm
from papermerge.core.db.exceptions import ResourceAccessDenied
from papermerge.core.utils.tz import utc_now
from papermerge.core.features.custom_fields.cf_types.registry import \
    TypeRegistry

logger = logging.getLogger(__name__)


"""
ORDER_BY_MAP = {
    "type": orm.CustomField.type.asc(),
    "-type": orm.CustomField.type.desc(),
    "name": orm.CustomField.name.asc(),
    "-name": orm.CustomField.name.desc(),
    "group_name": orm.Group.name.asc().nullsfirst(),
    "-group_name": orm.Group.name.desc().nullslast(),
}
"""

async def get_custom_fields(
    db_session: AsyncSession,
    *,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None,
    include_deleted: bool = False,
    include_archived: bool = True
) -> schema.PaginatedResponse[schema.CustomFieldEx]:
    """
    Get paginated custom fields with filtering and sorting support.

    Args:
        db_session: Database session
        user_id: Current user ID (for access control)
        page_size: Number of items per page
        page_number: Page number (1-based)
        sort_by: Column to sort by
        sort_direction: Sort direction ('asc' or 'desc')
        filters: Dictionary of filters with format:
            {
                "filter_name": {
                    "value": filter_value,
                    "operator": "in" | "like" | "eq" | "free_text"
                }
            }
        include_deleted: Whether to include soft-deleted custom fields
        include_archived: Whether to include archived custom fields

    Returns:
        Paginated response with custom fields including full audit trail
    """

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')
    owner_user = aliased(orm.User, name='owner_user')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build base query with joins for all audit user data and group info
    base_query = (
        select(orm.CustomField)
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        .join(owner_user, orm.CustomField.user_id == owner_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.CustomField.group_id, isouter=True)
    )

    # Apply access control - user can see custom fields they own or from their groups
    access_control_condition = or_(
        orm.CustomField.user_id == user_id,
        orm.CustomField.group_id.in_(user_groups_subquery)
    )

    where_conditions = [access_control_condition]

    # Apply default visibility filters
    if not include_deleted:
        where_conditions.append(orm.CustomField.deleted_at.is_(None))

    if not include_archived:
        where_conditions.append(orm.CustomField.archived_at.is_(None))

    # Apply custom filters
    if filters:
        filter_conditions = _build_custom_field_filter_conditions(
            filters, created_user, updated_user, deleted_user, archived_user
        )
        where_conditions.extend(filter_conditions)

    base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.CustomField.id))
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.CustomField.group_id, isouter=True)
        .where(and_(*where_conditions))
    )

    total_custom_fields = (await db_session.execute(count_query)).scalar()

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_custom_field_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            deleted_user=deleted_user,
            archived_user=archived_user
        )
    else:
        # Default sorting by created_at desc
        base_query = base_query.order_by(orm.CustomField.created_at.desc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include all audit user data and group info
    paginated_query_with_users = (
        base_query
        .add_columns(
            # Group info
            orm.Group.id.label('group_id'),
            orm.Group.name.label('group_name'),
            # Created by user
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            # Updated by user
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username'),
            # Deleted by user
            deleted_user.id.label('deleted_by_id'),
            deleted_user.username.label('deleted_by_username'),
            # Archived by user
            archived_user.id.label('archived_by_id'),
            archived_user.username.label('archived_by_username'),
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
        )
        .limit(page_size)
        .offset(offset)
    )

    # Execute query - get tuples with custom field and user/group data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with complete audit trail
    items = []
    for row in results:
        custom_field = row[0]  # The CustomField object

        # Build audit user objects (handle None values)
        created_by = None
        if row.created_by_id:
            created_by = schema.ByUser(
                id=row.created_by_id,
                username=row.created_by_username
            )

        updated_by = None
        if row.updated_by_id:
            updated_by = schema.ByUser(
                id=row.updated_by_id,
                username=row.updated_by_username
            )

        deleted_by = None
        if row.deleted_by_id:
            deleted_by = schema.ByUser(
                id=row.deleted_by_id,
                username=row.deleted_by_username
            )

        archived_by = None
        if row.archived_by_id:
            archived_by = schema.ByUser(
                id=row.archived_by_id,
                username=row.archived_by_username
            )

        if custom_field.user_id:
            owned_by = schema.OwnedBy(
                id=custom_field.user_id,
                name=row.owner_username,
                type="user"
            )
        else:  # group_id is not null (enforced by check constraint)
            owned_by = schema.OwnedBy(
                id=row.group_id,
                name=row.group_name,
                type="group"
            )

        custom_field_data = {
            "id": custom_field.id,
            "name": custom_field.name,
            "type_handler": custom_field.type_handler,
            "config": custom_field.config,
            "group_id": row.group_id,
            "created_at": custom_field.created_at,
            "updated_at": custom_field.updated_at,
            "deleted_at": custom_field.deleted_at,
            "archived_at": custom_field.archived_at,
            "created_by": created_by,
            "updated_by": updated_by,
            "deleted_by": deleted_by,
            "archived_by": archived_by,
            "owned_by": owned_by,
        }

        items.append(schema.CustomFieldEx(**custom_field_data))

    # Calculate total pages
    total_pages = math.ceil(total_custom_fields / page_size) if total_custom_fields > 0 else 1

    return schema.PaginatedResponse[schema.CustomFieldEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_custom_fields
    )


async def get_custom_fields_without_pagination(
    db_session: AsyncSession,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> list[schema.CustomField]:
    stmt_base = select(orm.CustomField).order_by(orm.CustomField.name.asc())

    if group_id:
        stmt = stmt_base.where(orm.CustomField.group_id == group_id)
    elif user_id:
        stmt = stmt_base.where(orm.CustomField.user_id == user_id)
    else:
        raise ValueError("Both: group_id and user_id are missing")

    db_cfs = (await db_session.scalars(stmt)).all()
    items = [schema.CustomField.model_validate(db_cf) for db_cf in db_cfs]

    return items

async def create_custom_field(
    session: AsyncSession,
    data: schema.CreateCustomField,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None
) -> schema.CustomField:
    """
    Create a new custom field

    Args:
        session: Database session
        data: Field creation data (Pydantic model)
        user_id: Owner user ID (mutually exclusive with group_id)
        group_id: Owner group ID (mutually exclusive with user_id)

    Returns:
        Created custom field (Pydantic model)

    Raises:
        ValueError: If neither or both user_id and group_id are provided
    """
    # Validate that exactly one of user_id or group_id is provided
    if user_id is None and group_id is None:
        raise ValueError("Either user_id or group_id must be provided")
    if user_id is not None and group_id is not None:
        raise ValueError("Cannot specify both user_id and group_id")

    # Validate type handler exists
    try:
        handler = TypeRegistry.get_handler(data.type_handler)
    except ValueError as e:
        raise ValueError(f"Invalid type handler: {data.type_handler}")

    # Validate configuration using handler's config model
    try:
        validated_config = handler.parse_config(data.config)
        config_dict = validated_config.model_dump()
    except ValidationError as e:
        raise ValueError(f"Invalid configuration: {e}")

    # Create ORM instance
    field = orm.CustomField(
        id=uuid.uuid4(),
        name=data.name,
        type_handler=data.type_handler,
        config=config_dict,
        user_id=user_id,
        group_id=group_id
    )

    session.add(field)
    await session.commit()
    await session.refresh(field)

    return schema.CustomField.model_validate(field)



async def get_custom_field(
    session: AsyncSession,
    user_id: uuid.UUID,
    custom_field_id: uuid.UUID
) -> schema.CustomFieldDetails:
    """
    Get a single custom field with full audit trail.

    Args:
        session: Database session
        user_id: Current user ID (for access control)
        custom_field_id: ID of the custom field to retrieve

    Returns:
        CustomFieldDetails with complete audit trail and ownership info

    Raises:
        NoResultFound: If custom field doesn't exist
        CustomFieldAccessError: If user doesn't have permission to access the custom field
    """

    # First check if the custom field exists at all
    exists_stmt = select(orm.CustomField.id).where(orm.CustomField.id == custom_field_id)
    exists_result = await session.execute(exists_stmt)
    if not exists_result.scalar():
        raise NoResultFound(f"Custom field with id {custom_field_id} not found")

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')
    owner_user = aliased(orm.User, name='owner_user')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build query with all audit user joins and group info
    stmt = (
        select(orm.CustomField)
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.CustomField.group_id, isouter=True)
        .join(owner_user, orm.CustomField.user_id == owner_user.id, isouter=True)
        .add_columns(
            # Group info
            orm.Group.id.label('group_id'),
            orm.Group.name.label('group_name'),
            # Owner user info
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Created by user
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            # Updated by user
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username'),
            # Deleted by user
            deleted_user.id.label('deleted_by_id'),
            deleted_user.username.label('deleted_by_username'),
            # Archived by user
            archived_user.id.label('archived_by_id'),
            archived_user.username.label('archived_by_username')
        )
        .where(
            and_(
                orm.CustomField.id == custom_field_id,
                # Access control: user can access if they own it directly or through group
                or_(
                    orm.CustomField.user_id == user_id,
                    orm.CustomField.group_id.in_(user_groups_subquery)
                )
            )
        )
    )

    # Execute query and get single result
    result = await session.execute(stmt)
    row = result.unique().first()

    # If no row returned, user doesn't have access (we know the custom field exists)
    if not row:
        raise ResourceAccessDenied(f"User {user_id} does not have permission to access custom field {custom_field_id}")

    custom_field = row[0]  # The CustomField object

    # Build audit user objects (handle None values)
    created_by = None
    if row.created_by_id:
        created_by = schema.ByUser(
            id=row.created_by_id,
            username=row.created_by_username
        )

    updated_by = None
    if row.updated_by_id:
        updated_by = schema.ByUser(
            id=row.updated_by_id,
            username=row.updated_by_username
        )

    deleted_by = None
    if row.deleted_by_id:
        deleted_by = schema.ByUser(
            id=row.deleted_by_id,
            username=row.deleted_by_username
        )

    archived_by = None
    if row.archived_by_id:
        archived_by = schema.ByUser(
            id=row.archived_by_id,
            username=row.archived_by_username
        )

    # Determine owner based on which ID exists
    if custom_field.user_id:
        owned_by = schema.OwnedBy(
            id=custom_field.user_id,
            name=row.owner_username,
            type="user"
        )
    else:  # group_id is not null (enforced by check constraint)
        owned_by = schema.OwnedBy(
            id=row.group_id,
            name=row.group_name,
            type="group"
        )

    # Build the complete CustomFieldDetails object
    custom_field_data = {
        "id": custom_field.id,
        "name": custom_field.name,
        "type": custom_field.type,
        "extra_data": custom_field.extra_data,
        "owned_by": owned_by,
        "created_at": custom_field.created_at,
        "updated_at": custom_field.updated_at,
        "deleted_at": custom_field.deleted_at,
        "archived_at": custom_field.archived_at,
        "created_by": created_by,
        "updated_by": updated_by,
        "deleted_by": deleted_by,
        "archived_by": archived_by
    }

    return schema.CustomFieldDetails(**custom_field_data)


async def delete_custom_field(
    session: AsyncSession,
    user_id: uuid.UUID,
    custom_field_id: uuid.UUID
):
    """
    Soft delete a custom field with access control.

    Args:
        session: Database session
        user_id: Current user ID (for access control)
        custom_field_id: ID of the custom field to delete

    Raises:
        NoResultFound: If custom field doesn't exist
        CustomFieldAccessError: If user doesn't have permission to delete the custom field
    """

    # First check if the custom field exists at all
    exists_stmt = select(orm.CustomField.id).where(
        orm.CustomField.id == custom_field_id
    )
    exists_result = await session.execute(exists_stmt)
    if not exists_result.scalar():
        raise NoResultFound(f"Custom field with id {custom_field_id} not found")

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Check if user has access to this custom field
    access_stmt = (
        select(orm.CustomField)
        .where(
            and_(
                orm.CustomField.id == custom_field_id,
                # Access control: user can delete if they own it directly or through group
                or_(
                    orm.CustomField.user_id == user_id,
                    orm.CustomField.group_id.in_(user_groups_subquery)
                )
            )
        )
    )

    access_result = await session.execute(access_stmt)
    custom_field = access_result.scalars().first()

    # If no result, user doesn't have access (we know the custom field exists)
    if not custom_field:
        raise ResourceAccessDenied(f"User {user_id} does not have permission to delete custom field {custom_field_id}")

    # Check if already soft deleted
    if custom_field.deleted_at is not None:
        # Custom field is already deleted - you might want to handle this differently
        # Option 1: Silently succeed (idempotent delete)
        return
        # Option 2: Raise an error
        # raise ValueError(f"Custom field {custom_field_id} is already deleted")

    # Perform soft delete by setting deleted_at and deleted_by
    # Note: The deleted_by will be set by the audit trigger using the audit context
    # that was established in the endpoint with AsyncAuditContext
    custom_field.deleted_at = utc_now()
    custom_field.deleted_by = user_id

    # Add to session and commit
    session.add(custom_field)
    await session.commit()


async def update_custom_field(
    session: AsyncSession,
    field_id: uuid.UUID,
    data: schema.UpdateCustomField
) -> schema.CustomField:
    """Update a custom field"""
    field = await session.get(orm.CustomField, field_id)
    if not field:
        raise ValueError(f"Custom field {field_id} not found")

    # Update fields
    if data.name is not None:
        field.name = data.name

    if data.type_handler is not None:
        # Validate new type handler
        try:
            TypeRegistry.get_handler(data.type_handler)
            field.type_handler = data.type_handler
        except ValueError:
            raise ValueError(f"Invalid type handler: {data.type_handler}")

    if data.config is not None:
        # Validate new config
        handler = TypeRegistry.get_handler(field.type_handler)
        try:
            validated_config = handler.parse_config(data.config)
            field.config = validated_config.model_dump()
        except ValidationError as e:
            raise ValueError(f"Invalid configuration: {e}")

    if data.group_id is not None:
        field.group_id = data.group_id
        field.user_id = None
    elif data.user_id is not None:
        field.user_id = data.user_id
        field.group_id = None

    await session.commit()
    await session.refresh(field)

    return schema.CustomField.model_validate(field)



async def get_document_custom_field_values(
    session: AsyncSession,
    document_id: uuid.UUID
) -> list[tuple[schema.CustomField, Any]]:
    """
    Get all custom field values for a document

    Returns:
        List of (field, value) tuples
    """
    # Get document type
    doc = await session.get(orm.Document, document_id)
    if not doc or not doc.document_type_id:
        return []

    # Get all fields for this document type
    stmt = select(orm.CustomField).join(
        orm.DocumentTypeCustomField,
        orm.DocumentTypeCustomField.custom_field_id == orm.CustomField.id
    ).where(
        orm.DocumentTypeCustomField.document_type_id == doc.document_type_id
    )

    fields = (await session.execute(stmt)).scalars().all()

    result = []
    for field in fields:
        value = await get_custom_field_value(session, document_id, field.id)
        field_model = schema.CustomField.model_validate(field)
        result.append((field_model, value))

    return result


async def query_documents_by_custom_fields(
    session: AsyncSession,
    params: schema.DocumentQueryParams
) -> list[uuid.UUID]:
    """
    Query documents by custom field values with filtering and sorting

    Args:
        session: Database session
        params: Query parameters (Pydantic model)

    Returns:
        List of document IDs matching the criteria
    """
    from sqlalchemy.orm import aliased

    # Start with documents of this type
    query = select(orm.Document.id).where(
        orm.Document.document_type_id == params.document_type_id
    )

    # Apply filters
    for i, filter_spec in enumerate(params.filters):
        # Get field definition
        field = await session.get(orm.CustomField, filter_spec.field_id)
        if not field:
            raise ValueError(f"Custom field {filter_spec.field_id} not found")

        # Get handler
        handler = TypeRegistry.get_handler(field.type_handler)

        # Parse config
        config = handler.parse_config(field.config or {})

        # Create alias for this join
        cfv_alias = aliased(orm.CustomFieldValue, name=f"cfv_{i}")

        # Get the appropriate sort column
        sort_column = getattr(cfv_alias, handler.get_sort_column())

        # Build filter expression
        filter_expr = handler.get_filter_expression(
            sort_column,
            filter_spec.operator,
            filter_spec.value,
            config
        )

        # Add join and filter
        query = query.join(
            cfv_alias,
            and_(
                cfv_alias.document_id == orm.Document.id,
                cfv_alias.field_id == field.id,
                filter_expr
            )
        )

    # Apply sorting
    if params.sort:
        # Get field for sorting
        sort_field = await session.get(orm.CustomField, params.sort.field_id)
        if not sort_field:
            raise ValueError(f"Custom field {params.sort.field_id} not found")

        # Get handler
        sort_handler = TypeRegistry.get_handler(sort_field.type_handler)

        # Create alias for sort join
        cfv_sort = aliased(orm.CustomFieldValue, name="cfv_sort")

        # Get sort column
        sort_column = getattr(cfv_sort, sort_handler.get_sort_column())

        # Add sort join
        query = query.join(
            cfv_sort,
            and_(
                cfv_sort.document_id == orm.Document.id,
                cfv_sort.field_id == sort_field.id
            )
        )

        # Add order by
        if params.sort.direction == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

    # Apply pagination
    if params.limit:
        query = query.limit(params.limit)
    if params.offset:
        query = query.offset(params.offset)

    # Execute
    result = await session.execute(query)
    return [row[0] for row in result.all()]


async def get_document_table_data(
        session: AsyncSession,
        document_type_id: uuid.UUID,
        filters: Optional[list[schema.CustomFieldFilter]] = None,
        sort: Optional[schema.CustomFieldSort] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
) -> tuple[list[schema.CustomField], list[dict]]:
    """
    Get complete table data for UI display

    Returns:
        Tuple of:
        - List of custom fields (columns)
        - List of row dicts with structure:
          {
              'document_id': UUID,
              'document_title': str,
              'field_<field_id>': <value>
          }

    This is optimized for your UI table use case.
    """
    # Get all custom fields for this document type
    stmt = select(orm.CustomField).join(
        orm.DocumentTypeCustomField,
        orm.DocumentTypeCustomField.custom_field_id == orm.CustomField.id
    ).where(
        orm.DocumentTypeCustomField.document_type_id == document_type_id
    ).order_by(orm.CustomField.name)

    fields = (await session.execute(stmt)).scalars().all()
    field_models = [schema.CustomField.model_validate(f) for f in fields]

    # Build query params
    query_params = schema.DocumentQueryParams(
        document_type_id=document_type_id,
        filters=filters or [],
        sort=sort,
        limit=limit,
        offset=offset
    )

    # Get matching document IDs
    doc_ids = await query_documents_by_custom_fields(session, query_params)

    # Fetch document details and all custom field values
    rows = []
    for doc_id in doc_ids:
        # Get document
        doc = await session.get(orm.Document, doc_id)
        if not doc:
            continue

        row = {
            'document_id': doc_id,
            'document_title': doc.title
        }

        # Get all custom field values for this document
        for field in fields:
            value = await get_custom_field_value(session, doc_id, field.id)
            row[f'field_{field.id}'] = value

        rows.append(row)

    return field_models, rows


async def set_custom_field_value(
    session: AsyncSession,
    document_id: uuid.UUID,
    data: schema.SetCustomFieldValue
) -> schema.CustomFieldValue:
    """
    Set a custom field value

    Args:
        session: Database session
        document_id: Document ID
        data: Value setting data (Pydantic model)

    Returns:
        Created/updated custom field value (Pydantic model)
    """
    # Get field definition
    field = await session.get(orm.CustomField, data.field_id)
    if not field:
        raise ValueError(f"Custom field {data.field_id} not found")

    # Get type
    # Get type handler
    handler = TypeRegistry.get_handler(field.type_handler)

    # Parse and validate configuration
    try:
        config = handler.parse_config(field.config or {})
    except ValidationError as e:
        raise ValueError(f"Invalid field configuration: {e}")

    # Validate value
    validation_result = handler.validate(data.value, config)
    if not validation_result.is_valid:
        raise ValueError(f"Validation failed: {validation_result.error}")

    # Convert to storage format (Pydantic model)
    storage_data = handler.to_storage(data.value, config)

    # Find or create value record
    stmt = select(orm.CustomFieldValue).where(
        and_(
            orm.CustomFieldValue.document_id == document_id,
            orm.CustomFieldValue.field_id == data.field_id
        )
    )
    cfv = (await session.execute(stmt)).scalar_one_or_none()

    if not cfv:
        cfv = orm.CustomFieldValue(
            id=uuid.uuid4(),
            document_id=document_id,
            field_id=data.field_id,
            created_at=utc_now(),
            updated_at=utc_now(),
            value=storage_data.model_dump()  # Convert Pydantic to dict for JSONB
        )
        session.add(cfv)
    else:
        cfv.value = storage_data.model_dump()  # Update JSONB

    await session.commit()
    await session.refresh(cfv)  # Refresh to get computed generated columns

    # Convert ORM to Pydantic with nested model
    return schema.CustomFieldValue(
        id=cfv.id,
        document_id=cfv.document_id,
        field_id=cfv.field_id,
        value=schema.CustomFieldValueData(**cfv.value),
        value_text=cfv.value_text,
        value_numeric=cfv.value_numeric,
        value_date=cfv.value_date,
        value_datetime=cfv.value_datetime,
        value_boolean=cfv.value_boolean,
        created_at=cfv.created_at,
        updated_at=cfv.updated_at
    )



async def bulk_set_custom_field_values(
    session: AsyncSession,
    document_id: uuid.UUID,
    values: dict[uuid.UUID, Any]
) -> list[schema.CustomFieldValue]:
    """
    Set multiple custom field values at once

    Args:
        session: Database session
        document_id: Document ID
        values: Dict mapping field_id -> value

    Returns:
        List of created/updated custom field values
    """
    results = []

    for field_id, value in values.items():
        set_data = schema.SetCustomFieldValue(
            field_id=field_id,
            value=value
        )
        cfv = await set_custom_field_value(session, document_id, set_data)
        results.append(cfv)

    return results


async def get_custom_field_value(
    session: AsyncSession,
    document_id: uuid.UUID,
    field_id: uuid.UUID
) -> schema.CustomFieldValue | None:  # Changed return type
    """Get a custom field value with automatic type handling"""

    # Get field definition
    field = await session.get(orm.CustomField, field_id)
    if not field:
        raise ValueError(f"Custom field {field_id} not found")

    # Get value record
    stmt = select(orm.CustomFieldValue).where(
        and_(
            orm.CustomFieldValue.document_id == document_id,
            orm.CustomFieldValue.field_id == field_id
        )
    )
    cfv = (await session.execute(stmt)).scalar_one_or_none()

    if not cfv:
        return None

    # Convert ORM to Pydantic with nested model (same pattern as set_custom_field_value)
    return schema.CustomFieldValue(
        id=cfv.id,
        document_id=cfv.document_id,
        field_id=cfv.field_id,
        value=schema.CustomFieldValueData(**cfv.value),
        created_at=cfv.created_at,
        updated_at=cfv.updated_at
    )


async def get_custom_field_values(
    session: AsyncSession,
    document_id: uuid.UUID
) -> list[schema.CustomFieldValue]:
    """
    Get all custom field values for a document

    Args:
        session: Database session
        document_id: Document ID

    Returns:
        List of custom field values (Pydantic models)
    """
    stmt = (
        select(orm.CustomFieldValue)
        .where(orm.CustomFieldValue.document_id == document_id)
    )

    result = await session.execute(stmt)
    cfvs = result.scalars().all()

    return [schema.CustomFieldValue.model_validate(cfv) for cfv in cfvs]


async def delete_custom_field_value(
        session: AsyncSession,
        document_id: uuid.UUID,
        field_id: uuid.UUID
) -> None:
    """
    Delete a custom field value for a specific document and field

    Args:
        session: Database session
        document_id: Document ID
        field_id: Custom field ID

    Returns:
        None
    """
    # Build delete statement
    stmt = delete(orm.CustomFieldValue).where(
        and_(
            orm.CustomFieldValue.document_id == document_id,
            orm.CustomFieldValue.field_id == field_id
        )
    )

    # Execute deletion
    await session.execute(stmt)
    await session.commit()

def _build_custom_field_filter_conditions(
    filters: Dict[str, Dict[str, Any]],
    created_user,
    updated_user,
    deleted_user,
    archived_user
) -> list:
    """Build SQLAlchemy WHERE conditions from filters dictionary for custom fields."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "types":
            if operator == "in" and isinstance(value, list):
                condition = orm.CustomField.type.in_(value)

        elif filter_name == "free_text":
            # Search across multiple text fields
            search_term = f"%{value}%"

            condition = or_(
                orm.CustomField.name.ilike(search_term),
                orm.CustomField.type.ilike(search_term),
                orm.Group.name.ilike(search_term),  # Group name search
            )

        elif filter_name == "name":
            if operator == "like":
                condition = orm.CustomField.name.ilike(f"%{value}%")
            elif operator == "eq":
                condition = orm.CustomField.name == value
            elif operator == "in" and isinstance(value, list):
                condition = orm.CustomField.name.in_(value)

        if condition is not None:
            conditions.append(condition)

    return conditions


def _apply_custom_field_sorting(
    query,
    sort_by: str,
    sort_direction: str,
    created_user,
    updated_user,
    deleted_user,
    archived_user,
):
    """Apply sorting to the custom fields query."""
    sort_column = None

    # Map sort_by to actual columns
    if sort_by == "id":
        sort_column = orm.CustomField.id
    elif sort_by == "name":
        sort_column = orm.CustomField.name
    elif sort_by == "type":
        sort_column = orm.CustomField.type
    elif sort_by == "created_at":
        sort_column = orm.CustomField.created_at
    elif sort_by == "updated_at":
        sort_column = orm.CustomField.updated_at
    elif sort_by == "created_by":
        # Sort by username of creator
        sort_column = created_user.username
    elif sort_by == "updated_by":
        # Sort by username of updater
        sort_column = updated_user.username

    if sort_column is not None:
        if sort_direction.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    return query
