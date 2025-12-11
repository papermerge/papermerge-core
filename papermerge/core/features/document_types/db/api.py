import logging
import math
import uuid
from typing import Optional, Dict, Any
from itertools import groupby

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, Sequence, case

from papermerge.core.db.exceptions import DependenciesExist
from papermerge.core import schema, orm, types
from papermerge.core import constants as const
from papermerge.core.tasks import send_task
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.utils.tz import utc_now
from papermerge.core.features.document_types import schema as dt_schema
from .orm import DocumentType

logger = logging.getLogger(__name__)


async def get_document_types_without_pagination(
    db_session: AsyncSession,
    owner: schema.Owner,
) -> Sequence[orm.DocumentType]:
    stmt = (
        select(orm.DocumentType)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.DOCUMENT_TYPE.value,
                orm.Ownership.resource_id == orm.DocumentType.id
            )
        )
        .where(
            orm.Ownership.owner_type == owner.owner_type,
            orm.Ownership.owner_id == owner.owner_id
        )
        .order_by(orm.DocumentType.name.asc())
    )

    return (await db_session.execute(stmt)).scalars().all()


async def get_document_types_by_owner_without_pagination(
    db_session: AsyncSession,
    owner: schema.Owner,
) -> Sequence[orm.DocumentType]:
    """
    Returns all document types that belongs to given owner.
    Results are not paginated.
    """

    document_type_ids = await ownership_api.get_resources_by_owner(
        db_session, owner_type=owner.owner_type, owner_id=owner.owner_id,
        resource_type=ResourceType.DOCUMENT_TYPE
    )

    stmt = select(orm.DocumentType).where(orm.DocumentType.id.in_(document_type_ids))
    result = (await db_session.execute(stmt)).all()

    return result


async def get_document_types_grouped_by_owner_without_pagination(
    db_session: AsyncSession,
    user_id: uuid.UUID,
) -> list[dt_schema.GroupedDocumentType]:
    """
    Returns all document types to which user has access to, grouped
    by owner. Results are not paginated.

    Uses the new ownership pattern with the Ownership table instead of
    user_id/group_id columns.
    """
    # Create aliases for owner joins
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id,
        orm.UserGroup.deleted_at.is_(None)
    )

    # Build query with ownership joins
    stmt = (
        select(
            DocumentType.id,
            DocumentType.name,
            # Ownership info
            Ownership.owner_type.label("owner_type"),
            Ownership.owner_id.label("owner_id"),
            # Owner user info (if owner is user)
            owner_user.username.label("owner_username"),
            # Owner group info (if owner is group)
            owner_group.name.label("owner_group_name"),
        )
        .select_from(DocumentType)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.DOCUMENT_TYPE.value,
                Ownership.resource_id == DocumentType.id
            )
        )
        # Join to owner_user when owner is a user
        .join(
            owner_user,
            and_(
                Ownership.owner_type == OwnerType.USER.value,
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        # Join to owner_group when owner is a group
        .join(
            owner_group,
            and_(
                Ownership.owner_type == OwnerType.GROUP.value,
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .where(
            or_(
                # User owns directly
                and_(
                    Ownership.owner_type == OwnerType.USER.value,
                    Ownership.owner_id == user_id
                ),
                # Owned by a group the user belongs to
                and_(
                    Ownership.owner_type == OwnerType.GROUP.value,
                    Ownership.owner_id.in_(user_groups_subquery)
                )
            )
        )
        .order_by(
            Ownership.owner_type,
            Ownership.owner_id,
            DocumentType.name.asc(),
        )
    )

    db_document_types = await db_session.execute(stmt)

    def keyfunc(row):
        """Group by owner name: 'My' for user-owned, group name for group-owned"""
        if row.owner_type == OwnerType.USER.value:
            return "My"
        return row.owner_group_name

    results = []
    document_types = list(db_document_types)

    for key, group in groupby(document_types, keyfunc):
        group_items = []
        for row in group:
            group_items.append(
                dt_schema.GroupedDocumentTypeItem(name=row.name, id=row.id)
            )
        results.append(dt_schema.GroupedDocumentType(name=key, items=group_items))

    return results


async def get_document_types(
    db_session: AsyncSession,
    *,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    sort_by: Optional[str] = None,
    sort_direction: Optional[str] = None,
    filters: Optional[Dict[str, Dict[str, Any]]] = None,
    include_deleted: bool = False
) -> schema.PaginatedResponse[schema.DocumentTypeEx]:
    """
    Get paginated document types with filtering and sorting support.

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
                    "operator": "free_text"
                }
            }

    Returns:
        Paginated response with document types including full audit trail
    """

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id
    )

    # Create user alias for owner
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Build base query with joins for all audit user data and group/owner info
    base_query = (
        select(orm.DocumentType)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.DOCUMENT_TYPE.value,
                orm.Ownership.resource_id == orm.DocumentType.id
            )
        )
        .join(created_user, orm.DocumentType.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.DocumentType.updated_by == updated_user.id, isouter=True)
        # Join to owner_user when owner is a user
        .join(
            owner_user,
            and_(
                orm.Ownership.owner_type == OwnerType.USER,
                orm.Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        # Join to owner_group when owner is a group
        .join(
            owner_group,
            and_(
                orm.Ownership.owner_type == OwnerType.GROUP,
                orm.Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )

    )

    # Apply access control - user can see document types they own or from their groups
    access_control_condition = or_(
        and_(
            orm.Ownership.owner_type == OwnerType.USER,
            orm.Ownership.owner_id == user_id
        ),
        and_(
            orm.Ownership.owner_type == OwnerType.GROUP,
            orm.Ownership.owner_id.in_(user_groups_subquery)
        )
    )

    where_conditions = [access_control_condition]
    if not include_deleted:
        where_conditions.append(orm.DocumentType.deleted_at.is_(None))

    # Apply custom filters
    if filters:
        filter_conditions = _build_document_type_filter_conditions(
            filters, created_user, updated_user
        )
        where_conditions.extend(filter_conditions)

    base_query = base_query.where(and_(*where_conditions))

    # Count total items (using the same filters)
    count_query = (
        select(func.count(orm.DocumentType.id))
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.DOCUMENT_TYPE.value,
                orm.Ownership.resource_id == orm.DocumentType.id
            )
        )
        .join(created_user, orm.DocumentType.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.DocumentType.updated_by == updated_user.id, isouter=True)
        .where(and_(*where_conditions))
    )

    total_document_types = (await db_session.execute(count_query)).scalar()

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_document_type_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            owner_user=owner_user,
            owner_group=owner_group
        )
    else:
        # Default sorting by name asc
        base_query = base_query.order_by(orm.DocumentType.name.asc())

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Modify query to include all audit user data and owner/group info
    paginated_query_with_users = (
        base_query
        .add_columns(
            # Ownership info
            orm.Ownership.owner_type.label('owner_type'),
            orm.Ownership.owner_id.label('owner_id'),
            # Owner group info
            owner_group.id.label('owner_group_id'),  # Changed from orm.Group
            owner_group.name.label('owner_group_name'),  # Changed from orm.Group
            # Owner user info
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Created by user
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            # Updated by user
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username')
        )
        .limit(page_size)
        .offset(offset)
    )

    # Execute query - get tuples with document type and user data
    results = (await db_session.execute(paginated_query_with_users)).all()

    # Convert to schema models with complete audit trail
    items = []
    for row in results:
        document_type = row[0]  # The DocumentType object

        if row.owner_type == OwnerType.USER:
            owned_by = schema.OwnedBy(
                id=row.owner_user_id,
                name=row.owner_username,
                type=OwnerType.USER
            )
        elif row.owner_type == OwnerType.GROUP:
            owned_by = schema.OwnedBy(
                id=row.owner_group_id,
                name=row.owner_group_name,
                type=OwnerType.GROUP
            )

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

        document_type_data = {
            "id": document_type.id,
            "name": document_type.name,
            "owned_by": owned_by,
            "created_at": document_type.created_at,
            "updated_at": document_type.updated_at,
            "created_by": created_by,
            "updated_by": updated_by
        }

        items.append(schema.DocumentTypeEx(**document_type_data))

    # Calculate total pages
    total_pages = math.ceil(total_document_types / page_size) if total_document_types > 0 else 1

    return schema.PaginatedResponse[schema.DocumentTypeEx](
        items=items,
        page_size=page_size,
        page_number=page_number,
        num_pages=total_pages,
        total_items=total_document_types
    )


async def document_type_cf_count(session: AsyncSession, document_type_id: uuid.UUID):
    """count number of custom fields associated to document type"""
    stmt = select(DocumentType).options(
        selectinload(orm.DocumentType.custom_fields)
    ).where(DocumentType.id == document_type_id)
    dtype = (await session.scalars(stmt)).one()
    return len(dtype.custom_fields)


async def create_document_type(
    session: AsyncSession,
    data: schema.CreateDocumentType
) -> orm.DocumentType:

    is_unique = await ownership_api.check_name_unique_for_owner(
        session=session,
        resource_type=ResourceType.DOCUMENT_TYPE,
        owner_type=data.owner_type,
        owner_id=data.owner_id,
        name=data.name
    )

    if not is_unique:
        raise ValueError(
            f"A Document type named '{data.name}' already exists for this {data.owner_type.value}"
        )

    if data.custom_field_ids is None:
        cf_ids = []
    else:
        cf_ids = data.custom_field_ids

    dtype = DocumentType(
        id=uuid.uuid4(),
        name=data.name,
        path_template=data.path_template,
    )

    try:
        session.add(dtype)
        await session.flush()  # Get the dtype.id available

        # Create association entries with positions
        for position, cf_id in enumerate(cf_ids):
            assoc = orm.DocumentTypeCustomField(
                document_type_id=dtype.id,
                custom_field_id=cf_id,
                position=position
            )
            session.add(assoc)

        # Set ownership
        await ownership_api.set_owner(
            session=session,
            resource=types.DocumentTypeResource(id=dtype.id),
            owner=types.Owner(owner_type=data.owner_type, owner_id=data.owner_id)
        )
        await session.commit()
        await session.refresh(dtype)
    except IntegrityError as e:
        await session.rollback()
        raise ValueError(f"Failed to create document type: {str(e)}")

    return dtype


import uuid
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

from papermerge.core import orm, schema
from papermerge.core.features.ownership.db.orm import Ownership
from papermerge.core.types import OwnerType, ResourceType
from papermerge.core.db.exceptions import ResourceAccessDenied


async def get_document_type(
    session: AsyncSession,
    user_id: uuid.UUID,
    document_type_id: uuid.UUID
) -> schema.DocumentTypeDetails:
    """
    Get a single document type with full audit trail using the new ownership model.

    Args:
        session: Database session
        user_id: Current user ID (for access control)
        document_type_id: ID of the document type to retrieve

    Returns:
        DocumentTypeDetails with complete audit trail and ownership info

    Raises:
        NoResultFound: If document type doesn't exist
        ResourceAccessDenied: If user doesn't have permission to access the document type
    """

    # First check if the document type exists at all
    exists_stmt = select(orm.DocumentType.id).where(
        orm.DocumentType.id == document_type_id
    )
    exists_result = await session.execute(exists_stmt)
    if not exists_result.scalar():
        raise NoResultFound(
            f"Document type with id {document_type_id} not found"
        )

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    deleted_user = aliased(orm.User, name='deleted_user')
    archived_user = aliased(orm.User, name='archived_user')
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Subquery to get user's group IDs (for access control)
    user_groups_subquery = select(orm.UserGroup.group_id).where(
        orm.UserGroup.user_id == user_id,
        orm.UserGroup.deleted_at.is_(None)
    )

    # Build query with all audit user joins and ownership info
    stmt = (
        select(orm.DocumentType)
        .options(
            selectinload(orm.DocumentType.custom_fields)
        )
        # Join ownership table
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.DOCUMENT_TYPE.value,
                Ownership.resource_id == orm.DocumentType.id
            )
        )
        # Join audit trail users
        .join(
            created_user,
            orm.DocumentType.created_by == created_user.id,
            isouter=True
        )
        .join(
            updated_user,
            orm.DocumentType.updated_by == updated_user.id,
            isouter=True
        )
        .join(
            deleted_user,
            orm.DocumentType.deleted_by == deleted_user.id,
            isouter=True
        )
        .join(
            archived_user,
            orm.DocumentType.archived_by == archived_user.id,
            isouter=True
        )
        # Join owner_user when owner is a user
        .join(
            owner_user,
            and_(
                Ownership.owner_type == OwnerType.USER.value,
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        # Join owner_group when owner is a group
        .join(
            owner_group,
            and_(
                Ownership.owner_type == OwnerType.GROUP.value,
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .add_columns(
            # Ownership info
            Ownership.owner_type.label('owner_type'),
            Ownership.owner_id.label('owner_id'),
            # Owner user info
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Owner group info
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
        .where(
            and_(
                orm.DocumentType.id == document_type_id,
                # Access control: user can access if they own it directly or through group
                or_(
                    # User owns it directly
                    and_(
                        Ownership.owner_type == OwnerType.USER.value,
                        Ownership.owner_id == user_id
                    ),
                    # User's group owns it
                    and_(
                        Ownership.owner_type == OwnerType.GROUP.value,
                        Ownership.owner_id.in_(user_groups_subquery)
                    )
                )
            )
        )
    )

    # Execute query and get single result
    result = await session.execute(stmt)
    row = result.unique().first()

    # If no row returned, user doesn't have access (we know the document type exists)
    if not row:
        raise ResourceAccessDenied(
            f"User {user_id} does not have permission to access "
            f"document type {document_type_id}"
        )

    document_type = row[0]  # The DocumentType object

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
    if row.owner_type == OwnerType.USER.value:
        owned_by = schema.OwnedBy(
            id=row.owner_id,
            name=row.owner_username,
            type=OwnerType.USER
        )
    else:  # OwnerType.GROUP
        owned_by = schema.OwnedBy(
            id=row.owner_id,
            name=row.owner_group_name,
            type=OwnerType.GROUP
        )

    # Build the complete DocumentTypeDetails object
    document_type_data = {
        "id": document_type.id,
        "name": document_type.name,
        "path_template": document_type.path_template,
        "custom_fields": document_type.custom_fields,
        "owned_by": owned_by,
        "created_at": document_type.created_at,
        "updated_at": document_type.updated_at,
        "deleted_at": document_type.deleted_at,
        "archived_at": document_type.archived_at,
        "created_by": created_by,
        "updated_by": updated_by,
        "deleted_by": deleted_by,
        "archived_by": archived_by
    }

    return schema.DocumentTypeDetails(**document_type_data)

async def delete_document_type(
    session: AsyncSession,
    user_id: uuid.UUID,
    document_type_id: uuid.UUID
):
    """
    Soft delete a document type

    Prevents deletion if:
    - Document type has associated custom fields (non-deleted)
    - Document type has associated documents (non-deleted)

    Args:
        session: Database session
        user_id: Current user ID
        document_type_id: ID of the document type to delete

    Raises:
        NoResultFound: If document type doesn't exist
        ResourceAccessDenied: If user doesn't have permission to delete the document type
        DependenciesExist: If document type has dependencies (custom fields or documents)
    """

    # First check if the document type exists at all
    exists_stmt = select(DocumentType.id).where(
        DocumentType.id == document_type_id
    )
    exists_result = await session.execute(exists_stmt)
    if not exists_result.scalar():
        raise NoResultFound(f"Document type with id {document_type_id} not found")

    stmt = (
        select(DocumentType)
        .where(DocumentType.id == document_type_id)
    )

    result = await session.execute(stmt)
    document_type = result.scalars().first()

    # Check if already soft deleted
    if document_type.deleted_at is not None:
        # Document type is already deleted - silently succeed (idempotent delete)
        return

    # Check for associated custom fields (via document_types_custom_fields)
    # Only count associations where the custom field is not soft deleted
    custom_fields_count_stmt = (
        select(func.count(orm.DocumentTypeCustomField.id))
        .select_from(
            orm.DocumentTypeCustomField.__table__.join(
                orm.CustomField.__table__,
                orm.DocumentTypeCustomField.custom_field_id == orm.CustomField.id
            )
        )
        .where(
            and_(
                orm.DocumentTypeCustomField.document_type_id == document_type_id,
                orm.CustomField.deleted_at.is_(None)  # Only count non-deleted custom fields
            )
        )
    )
    custom_fields_result = await session.execute(custom_fields_count_stmt)
    custom_fields_count = custom_fields_result.scalar()

    if custom_fields_count > 0:
        raise DependenciesExist(
            f"Cannot delete document type {document_type_id}: "
            f"it has {custom_fields_count} associated custom fields. "
            "Remove all custom field associations first."
        )

    # Check for associated documents
    # Only count non-deleted documents
    documents_count_stmt = select(func.count(orm.Document.id)).where(
        and_(
            orm.Document.document_type_id == document_type_id,
            orm.Document.deleted_at.is_(None)  # Only count non-deleted documents
        )
    )
    documents_result = await session.execute(documents_count_stmt)
    documents_count = documents_result.scalar()

    if documents_count > 0:
        raise DependenciesExist(
            f"Cannot delete document type {document_type_id}: "
            f"it has {documents_count} associated documents. "
            "Delete or reassign all documents first."
        )

    # All checks passed - perform soft delete
    document_type.deleted_at = utc_now()
    document_type.deleted_by = user_id

    # Add to session and commit
    session.add(document_type)
    await session.commit()


async def update_document_type(
    session: AsyncSession,
    document_type_id: uuid.UUID,
    attrs: schema.UpdateDocumentType,
) -> orm.DocumentType:
    """
    Update a document type with proper validation.

    Args:
        session: Database session
        document_type_id: ID of the document type to update
        attrs: Update attributes

    Raises:
        NoResultFound: If document type doesn't exist or is soft deleted
        ValueError: If invalid attributes provided
    """

    # Get document type with soft delete check
    stmt = (
        select(DocumentType)
        .options(selectinload(orm.DocumentType.custom_fields))
        .where(
            and_(
                DocumentType.id == document_type_id,
                DocumentType.deleted_at.is_(None)  # Exclude soft deleted
            )
        )
    )

    result = await session.execute(stmt)
    doc_type: DocumentType = result.scalars().first()

    if not doc_type:
        raise NoResultFound(f"Document type with id {document_type_id} not found")

    # Update custom fields if provided
    if attrs.custom_field_ids is not None:
        if attrs.custom_field_ids:  # Non-empty list
            # Validate that custom fields exist and are not soft deleted
            custom_fields_stmt = select(orm.CustomField).where(
                and_(
                    orm.CustomField.id.in_(attrs.custom_field_ids),
                    orm.CustomField.deleted_at.is_(None)  # Only non-deleted custom fields
                )
            )
            custom_fields = (await session.execute(custom_fields_stmt)).scalars().all()

            # Check if all requested custom fields were found
            found_ids = {cf.id for cf in custom_fields}
            requested_ids = set(attrs.custom_field_ids)
            missing_ids = requested_ids - found_ids

            if missing_ids:
                raise ValueError(f"Custom fields not found or deleted: {missing_ids}")

            doc_type.custom_fields = custom_fields
        else:  # Empty list - remove all custom fields
            doc_type.custom_fields = []

    # Update name if provided
    if attrs.name is not None:
        doc_type.name = attrs.name

    if attrs.owner_type is not None and attrs.owner_id is not None:
        owner_type = OwnerType(attrs.owner_type)
        owner_id = attrs.owner_id

        # Check name uniqueness under new owner (if name wasn't changed above)
        if attrs.name is None:
            is_unique = await ownership_api.check_name_unique_for_owner(
                session=session,
                resource_type=ResourceType.DOCUMENT_TYPE,
                owner_type=owner_type,
                owner_id=owner_id,
                name=doc_type.name,
                exclude_id=doc_type.id
            )

            if not is_unique:
                raise ValueError(
                    f"A custom document type '{doc_type.name}' already exists for the target {owner_type.value}"
                )

        # Update ownership
        await ownership_api.set_owner(
            session=session,
            resource=types.DocumentTypeResource(id=doc_type.id),
            owner=types.Owner(owner_type=owner_type, owner_id=owner_id)
        )


    # Update path template and track if notification needed
    notify_path_tmpl_worker = False
    if attrs.path_template is not None and doc_type.path_template != attrs.path_template:
        doc_type.path_template = attrs.path_template
        notify_path_tmpl_worker = True

    # Commit changes
    session.add(doc_type)
    await session.commit()
    await session.refresh(doc_type)

    # Send background task if path template changed
    if notify_path_tmpl_worker:
        # background task to move all doc_type documents
        # to new target path based on path template evaluation
        send_task(
            const.PATH_TMPL_MOVE_DOCUMENTS,
            kwargs={"document_type_id": str(document_type_id)},
            route_name="path_tmpl",
        )

    return doc_type


def _build_document_type_filter_conditions(
    filters: Dict[str, Dict[str, Any]],
    created_user,
    updated_user
) -> list:
    """Build SQLAlchemy WHERE conditions from filters dictionary for document types."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if not value:
            continue

        condition = None

        if filter_name == "free_text":
            # Search across document type name
            search_term = f"%{value}%"
            condition = orm.DocumentType.name.ilike(search_term)

        if condition is not None:
            conditions.append(condition)

    return conditions


def _apply_document_type_sorting(
    query,
    sort_by: str,
    sort_direction: str,
    created_user,
    updated_user,
    owner_user,
    owner_group
):
    """Apply sorting to the document types query."""
    sort_column = None

    # Map sort_by to actual columns
    if sort_by == "id":
        sort_column = orm.DocumentType.id
    elif sort_by == "name":
        sort_column = orm.DocumentType.name
    elif sort_by == "created_at":
        sort_column = orm.DocumentType.created_at
    elif sort_by == "updated_at":
        sort_column = orm.DocumentType.updated_at
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
