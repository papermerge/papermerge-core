import math
import logging
import uuid
from typing import Optional, Dict, Any

from pydantic import ValidationError
from sqlalchemy import select, case, or_, and_, asc, desc, delete, func
from sqlalchemy.orm import aliased
from sqlalchemy.exc import NoResultFound, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm
from papermerge.core.db.exceptions import ResourceAccessDenied
from papermerge.core.utils.tz import utc_now
from papermerge.core.features.custom_fields.cf_types.registry import \
    TypeRegistry
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import OwnerType, ResourceType
from papermerge.core.features.ownership.db.orm import Ownership

logger = logging.getLogger(__name__)


async def get_custom_fields_without_pagination(
    db_session: AsyncSession,
    owner: schema.Owner,
    document_type_id: uuid.UUID | None = None
) -> list[schema.CustomField]:
    """
    Get all custom fields for a given owner without pagination.

    Args:
        db_session: Database session
        owner: Owner object containing owner_type and owner_id

    Returns:
        List of custom fields owned by the specified owner
    """
    # Create owner aliases for joins
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Query with all data in one go (avoids N+1)
    stmt = (
        select(orm.CustomField)
        .add_columns(
            Ownership.owner_type,
            Ownership.owner_id,
            owner_user.id.label('user_id'),
            owner_user.username.label('username'),
            owner_group.id.label('group_id'),
            owner_group.name.label('group_name'),
        )
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.CUSTOM_FIELD.value,
                Ownership.resource_id == orm.CustomField.id
            )
        )
        .join(
            owner_user,
            and_(
                Ownership.owner_type == 'user',
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        .join(
            owner_group,
            and_(
                Ownership.owner_type == 'group',
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .where(
            Ownership.owner_type == owner.owner_type,
            Ownership.owner_id == owner.owner_id
        )
        .order_by(orm.CustomField.name.asc())
    )

    if document_type_id is not None:
        stmt = stmt.join(
            orm.DocumentTypeCustomField,
            orm.CustomField.id == orm.DocumentTypeCustomField.custom_field_id
        ).join(
            orm.DocumentType,
            orm.DocumentTypeCustomField.document_type_id == orm.DocumentType.id
        ).where(
            orm.DocumentType.id == document_type_id
        )

    results = (await db_session.execute(stmt)).all()

    # Build response
    items = []
    for row in results:
        db_cf = row[0]  # The CustomField object

        # Build owned_by from row data
        if row.owner_type == 'user':
            owned_by = schema.OwnedBy(
                id=row.user_id,
                name=row.username,
                type=OwnerType.USER
            )
        else:  # group
            owned_by = schema.OwnedBy(
                id=row.group_id,
                name=row.group_name,
                type=OwnerType.GROUP
            )

        items.append(schema.CustomField(
            id=db_cf.id,
            name=db_cf.name,
            type_handler=db_cf.type_handler,
            config=db_cf.config,
            owned_by=owned_by,
            created_at=db_cf.created_at,
            updated_at=db_cf.updated_at,
            created_by=None,
            updated_by=None,
        ))

    return items


async def create_custom_field(
    session: AsyncSession,
    data: schema.CreateCustomField,
) -> schema.CustomField:
    """
    Create a new custom field

    Args:
        session: Database session
        data: Field creation data (must include owner_type and owner_id)

    Returns:
        Created custom field (Pydantic model)

    Raises:
        ValueError: If owner information is invalid or name is not unique
    """
    # Validate owner info is provided
    if not data.owner_type or not data.owner_id:
        raise ValueError("owner_type and owner_id are required")

    owner_type = OwnerType(data.owner_type)
    owner_id = data.owner_id

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

    # Check uniqueness
    is_unique = await ownership_api.check_name_unique_for_owner(
        session=session,
        resource_type=ResourceType.CUSTOM_FIELD,
        owner_type=owner_type,
        owner_id=owner_id,
        name=data.name
    )

    if not is_unique:
        raise ValueError(
            f"A custom field named '{data.name}' already exists for this {owner_type.value}"
        )

    # Create ORM instance WITHOUT user_id/group_id
    field = orm.CustomField(
        id=uuid.uuid4(),
        name=data.name,
        type_handler=data.type_handler,
        config=config_dict,
    )

    session.add(field)

    try:
        await session.flush()

        # Set ownership
        await ownership_api.set_owner(
            session=session,
            resource_type=ResourceType.CUSTOM_FIELD,
            resource_id=field.id,
            owner_type=owner_type,
            owner_id=owner_id
        )

        await session.commit()
        await session.refresh(field)

    except IntegrityError as e:
        await session.rollback()
        raise ValueError(f"Failed to create custom field: {str(e)}")

    # Get owner details for Pydantic model
    owned_by = await ownership_api.get_owner_details(
        session=session,
        resource_type=ResourceType.CUSTOM_FIELD,
        resource_id=field.id
    )

    # Build Pydantic model with owned_by
    return schema.CustomField(
        id=field.id,
        name=field.name,
        type_handler=field.type_handler,
        config=field.config,
        owned_by=owned_by,
        created_at=field.created_at,
        updated_at=field.updated_at,
    )


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
        filters: Dictionary of filters
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
    owner_group = aliased(orm.Group, name='owner_group')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Build base query with ownership join
    base_query = (
        select(orm.CustomField)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.CUSTOM_FIELD.value,
                Ownership.resource_id == orm.CustomField.id
            )
        )
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        # Join to owner_user when owner is a user
        .join(
            owner_user,
            and_(
                Ownership.owner_type == 'user',
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        # Join to owner_group when owner is a group
        .join(
            owner_group,
            and_(
                Ownership.owner_type == 'group',
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
    )

    # Apply access control - user can see custom fields they own or from their groups
    access_control_condition = or_(
        and_(
            Ownership.owner_type == 'user',
            Ownership.owner_id == user_id
        ),
        and_(
            Ownership.owner_type == 'group',
            Ownership.owner_id.in_(user_groups_subquery)
        )
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
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.CUSTOM_FIELD.value,
                Ownership.resource_id == orm.CustomField.id
            )
        )
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
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
            archived_user=archived_user,
            owner_user=owner_user,
            owner_group=owner_group
        )
    else:
        # Default sorting by created_at desc
        base_query = base_query.order_by(orm.CustomField.created_at.desc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include all audit user data and ownership info
    paginated_query_with_users = (
        base_query
        .add_columns(
            # Ownership info
            Ownership.owner_type.label('owner_type'),
            Ownership.owner_id.label('owner_id'),
            # Owner user info (if owner is user)
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Owner group info (if owner is group)
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name'),
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

        # Build owned_by from ownership data
        if row.owner_type == 'user':
            owned_by = schema.OwnedBy(
                id=row.owner_user_id,
                name=row.owner_username,
                type="user"
            )
        elif row.owner_type == 'group':
            owned_by = schema.OwnedBy(
                id=row.owner_group_id,
                name=row.owner_group_name,
                type="group"
            )
        else:
            # Shouldn't happen, but handle gracefully
            raise ValueError(f"Unknown owner type: {row.owner_type}")

        custom_field_data = {
            "id": custom_field.id,
            "name": custom_field.name,
            "type_handler": custom_field.type_handler,
            "config": custom_field.config,
            "group_id": row.owner_group_id if row.owner_type == 'group' else None,  # For backward compatibility
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


async def get_custom_field(
    session: AsyncSession,
    custom_field_id: uuid.UUID
) -> schema.CustomFieldDetails:
    """
    Get a single custom field with full audit trail.

    Args:
        session: Database session
        custom_field_id: ID of the custom field to retrieve

    Returns:
        CustomFieldDetails with complete audit trail and ownership info

    Raises:
        NoResultFound: If custom field doesn't exist
    """
    from papermerge.core.features.ownership.db.orm import Ownership
    from papermerge.core.types import ResourceType

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Build query with ownership and all audit user joins
    stmt = (
        select(orm.CustomField)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.CUSTOM_FIELD.value,
                Ownership.resource_id == orm.CustomField.id
            )
        )
        .join(created_user, orm.CustomField.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.CustomField.updated_by == updated_user.id, isouter=True)
        .join(deleted_user, orm.CustomField.deleted_by == deleted_user.id, isouter=True)
        .join(archived_user, orm.CustomField.archived_by == archived_user.id, isouter=True)
        # Join to owner_user when owner is a user
        .join(
            owner_user,
            and_(
                Ownership.owner_type == 'user',
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        # Join to owner_group when owner is a group
        .join(
            owner_group,
            and_(
                Ownership.owner_type == 'group',
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .add_columns(
            # Ownership info
            Ownership.owner_type,
            Ownership.owner_id,
            # Owner user info (if owner is user)
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Owner group info (if owner is group)
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name'),
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
        .where(orm.CustomField.id == custom_field_id)
    )

    # Execute query and get single result
    result = await session.execute(stmt)
    row = result.first()

    if not row:
        raise NoResultFound(f"Custom field with id {custom_field_id} not found")

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

    # Build owned_by from ownership data
    if row.owner_type == 'user':
        owned_by = schema.OwnedBy(
            id=row.owner_user_id,
            name=row.owner_username,
            type="user"
        )
    else:  # group
        owned_by = schema.OwnedBy(
            id=row.owner_group_id,
            name=row.owner_group_name,
            type="group"
        )

    # Build the complete CustomFieldDetails object
    return schema.CustomFieldDetails(
        id=custom_field.id,
        name=custom_field.name,
        type_handler=custom_field.type_handler,
        config=custom_field.config,
        owned_by=owned_by,
        created_at=custom_field.created_at,
        updated_at=custom_field.updated_at,
        deleted_at=custom_field.deleted_at,
        archived_at=custom_field.archived_at,
        created_by=created_by,
        updated_by=updated_by,
        deleted_by=deleted_by,
        archived_by=archived_by
    )


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
        ResourceAccessDenied: If user doesn't have permission to delete the custom field
    """
    from papermerge.core.features.ownership.db import api as ownership_api
    from papermerge.core.types import ResourceType

    # First check if the custom field exists
    exists_stmt = select(orm.CustomField.id).where(
        orm.CustomField.id == custom_field_id
    )
    exists_result = await session.execute(exists_stmt)
    if not exists_result.scalar():
        raise NoResultFound(f"Custom field with id {custom_field_id} not found")

    # Check if user has access to this custom field
    has_access = await ownership_api.user_can_access_resource(
        session=session,
        user_id=user_id,
        resource_type=ResourceType.CUSTOM_FIELD,
        resource_id=custom_field_id
    )

    if not has_access:
        raise ResourceAccessDenied(
            f"User {user_id} does not have permission to delete custom field {custom_field_id}"
        )

    # Get the custom field
    stmt = select(orm.CustomField).where(orm.CustomField.id == custom_field_id)
    result = await session.execute(stmt)
    custom_field = result.scalar_one()

    # Check if already soft deleted
    if custom_field.deleted_at is not None:
        # Custom field is already deleted - idempotent delete
        return

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
        # Check if we're changing ownership
        if data.owner_type and data.owner_id:
            # If changing ownership, check uniqueness under new owner
            owner_type = OwnerType(data.owner_type)
            owner_id = data.owner_id
        else:
            # If not changing ownership, get current owner for uniqueness check
            current_owner = await ownership_api.get_owner_info(
                session=session,
                resource_type=ResourceType.CUSTOM_FIELD,
                resource_id=field_id
            )
            if current_owner:
                owner_type, owner_id = current_owner
            else:
                raise ValueError(f"No owner found for custom field {field_id}")

        # Check name uniqueness
        is_unique = await ownership_api.check_name_unique_for_owner(
            session=session,
            resource_type=ResourceType.CUSTOM_FIELD,
            owner_type=owner_type,
            owner_id=owner_id,
            name=data.name,
            exclude_id=field_id
        )

        if not is_unique:
            raise ValueError(
                f"A custom field named '{data.name}' already exists for this {owner_type.value}"
            )

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

    # Handle ownership transfer
    if data.owner_type is not None and data.owner_id is not None:
        owner_type = OwnerType(data.owner_type)
        owner_id = data.owner_id

        # Check name uniqueness under new owner (if name wasn't changed above)
        if data.name is None:
            is_unique = await ownership_api.check_name_unique_for_owner(
                session=session,
                resource_type=ResourceType.CUSTOM_FIELD,
                owner_type=owner_type,
                owner_id=owner_id,
                name=field.name,
                exclude_id=field_id
            )

            if not is_unique:
                raise ValueError(
                    f"A custom field named '{field.name}' already exists for the target {owner_type.value}"
                )

        # Update ownership
        await ownership_api.set_owner(
            session=session,
            resource_type=ResourceType.CUSTOM_FIELD,
            resource_id=field_id,
            owner_type=owner_type,
            owner_id=owner_id
        )

    await session.commit()
    await session.refresh(field)

    # Get owner details for response
    owned_by = await ownership_api.get_owner_details(
        session=session,
        resource_type=ResourceType.CUSTOM_FIELD,
        resource_id=field_id
    )

    # Build Pydantic model with owned_by
    return schema.CustomField(
        id=field.id,
        name=field.name,
        type_handler=field.type_handler,
        config=field.config,
        owned_by=owned_by,
        created_at=field.created_at,
        updated_at=field.updated_at,
    )


async def get_document_custom_field_values(
    session: AsyncSession,
    document_id: uuid.UUID
) -> list[schema.CustomFieldWithValue]:
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
        field_model = schema.CustomFieldShort.model_validate(field)
        result.append(
            schema.CustomFieldWithValue(custom_field=field_model, value=value)
        )

    return result


async def query_documents_by_custom_fields(
    session: AsyncSession,
    params: schema.DocumentQueryParams,
    user_id:uuid.UUID
) -> list[uuid.UUID]:
    """
    Query documents by custom field values with filtering and sorting

    Args:
        session: Database session
        params: Query parameters (Pydantic model)
        user_id

    Returns:
        List of document IDs matching the criteria
    """
    # Start with documents of this type
    conditions = [orm.Document.document_type_id == params.document_type_id]
    query = select(orm.Document.id, orm.Document.title)
    # Add user filter if provided
    if user_id is not None:
        # Subquery to get user's group IDs
        user_groups_subquery = select(orm.UserGroup.group_id).where(
            orm.UserGroup.user_id == user_id
        )

        # Join with Ownership table for access control
        query = query.join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.NODE.value,
                orm.Ownership.resource_id == orm.Document.id
            )
        )

        # User can access documents they own or from their groups
        access_control_condition = or_(
            and_(
                orm.Ownership.owner_type == OwnerType.USER.value,
                orm.Ownership.owner_id == user_id
            ),
            and_(
                orm.Ownership.owner_type == OwnerType.GROUP.value,
                orm.Ownership.owner_id.in_(user_groups_subquery)
            )
        )
        conditions.append(access_control_condition)

    query = query.where(and_(*conditions))

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


async def update_document_custom_field_values(
    session: AsyncSession,
    document_id: uuid.UUID,
    custom_fields: dict[str, Any],
) -> list[schema.CustomFieldWithValue]:
    """
    Update document's custom field values using new JSONB schema

    Args:
        session: Database session
        document_id: Document ID
        custom_fields: Dict mapping custom field names to values

    Returns:
        List of (field, value) tuples - same format as get_document_custom_field_values()
    """
    # Get all custom fields for this document type
    field_values = await get_document_custom_field_values(
        session,
        document_id=document_id
    )

    # Process each custom field that's in the input dict
    for item in field_values:
        if item.custom_field.name not in custom_fields:
            continue

        input_value = custom_fields[item.custom_field.name]

        # Get the type handler for this field
        handler = TypeRegistry.get_handler(item.custom_field.type_handler)

        # Parse the field configuration
        config = handler.parse_config(item.custom_field.config or {})

        # Special handling for date fields to support flexible input formats
        # like "2024-10-28 00:00:00" or "2024-10-28 anything"
        if item.custom_field.type_handler == "date" and isinstance(input_value, str):
            # Extract just the date part (YYYY-MM-DD)
            input_value = input_value.split()[0]  # Take first part before any space

        # Validate the value
        validation_result = handler.validate(input_value, config)
        if not validation_result.is_valid:
            raise ValueError(
                f"Validation failed for field '{item.custom_field.name}': "
                f"{validation_result.error}"
            )

        # Convert to storage format
        storage_data = handler.to_storage(input_value, config)

        # Find or create the value record
        stmt = select(orm.CustomFieldValue).where(
            and_(
                orm.CustomFieldValue.document_id == document_id,
                orm.CustomFieldValue.field_id == item.custom_field.id
            )
        )
        cfv = (await session.execute(stmt)).scalar_one_or_none()

        if not cfv:
            # Create new value record
            cfv = orm.CustomFieldValue(
                id=uuid.uuid4(),
                document_id=document_id,
                field_id=item.custom_field.id,
                created_at=utc_now(),
                updated_at=utc_now(),
                value=storage_data.model_dump()  # Convert Pydantic to dict for JSONB
            )
            session.add(cfv)
        else:
            # Update existing value record
            cfv.value = storage_data.model_dump()
            cfv.updated_at = utc_now()

    await session.commit()

    # Return updated values in the same format as get_document_custom_field_values()
    return await get_document_custom_field_values(session, document_id)


async def get_document_table_data(
    session: AsyncSession,
    document_type_id: uuid.UUID,
    user_id: uuid.UUID,
    filters: Optional[list[schema.CustomFieldFilter]] = None,
    sort: Optional[schema.CustomFieldSort] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None
) -> tuple[list[schema.CustomField], list[dict]]:
    """
    Get complete table data for UI display
    """
    # Get all custom fields for this document type
    stmt = select(orm.CustomField).join(
        orm.DocumentTypeCustomField,
        orm.DocumentTypeCustomField.custom_field_id == orm.CustomField.id
    ).where(
        orm.DocumentTypeCustomField.document_type_id == document_type_id
    ).order_by(orm.CustomField.name)

    fields = (await session.execute(stmt)).scalars().all()
    field_models = [schema.CustomFieldShort.model_validate(f) for f in fields]

    # Build query params
    query_params = schema.DocumentQueryParams(
        document_type_id=document_type_id,
        filters=filters or [],
        sort=sort,
        limit=limit,
        offset=offset
    )

    doc_ids = await query_documents_by_custom_fields(session, query_params, user_id=user_id)

    # Create aliases for the user tables to avoid conflicts
    created_by_user = aliased(orm.User)
    updated_by_user = aliased(orm.User)

    # Fetch document details and all custom field values
    rows = []
    for doc_id in doc_ids:
        # Get document with audit user information
        stmt = (
            select(
                orm.Document,
                created_by_user.id.label('created_by_id'),
                created_by_user.username.label('created_by_username'),
                updated_by_user.id.label('updated_by_id'),
                updated_by_user.username.label('updated_by_username')
            )
            .outerjoin(created_by_user, orm.Document.created_by == created_by_user.id)
            .outerjoin(updated_by_user, orm.Document.updated_by == updated_by_user.id)
            .where(orm.Document.id == doc_id)
        )

        result = await session.execute(stmt)
        row_data = result.one_or_none()

        if not row_data:
            continue

        doc = row_data[0]

        row = {
            'document_id': doc_id,
            'document_title': doc.title,
            'created_at': doc.created_at,
            'updated_at': doc.updated_at,
            'created_by_id': row_data.created_by_id,
            'created_by_username': row_data.created_by_username,
            'updated_by_id': row_data.updated_by_id,
            'updated_by_username': row_data.updated_by_username
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
                condition = orm.CustomField.type_handler.in_(value)

        elif filter_name == "free_text":
            # Search across multiple text fields
            search_term = f"%{value}%"

            condition = or_(
                orm.CustomField.name.ilike(search_term),
                orm.CustomField.type_handler.ilike(search_term),
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
    owner_user,
    owner_group,
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
        sort_column = orm.CustomField.type_handler
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
    elif sort_by == "owned_by":
        sort_column = case(
            (orm.Ownership.owner_type == OwnerType.USER, owner_user.username),
            (orm.Ownership.owner_type == OwnerType.GROUP, owner_group.name),
            else_=None
        )

    if sort_column is not None:
        if sort_direction.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

    return query
