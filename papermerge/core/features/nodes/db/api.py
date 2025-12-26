import logging
import uuid
import math
from typing import Union, Tuple, Iterable
from uuid import UUID

from sqlalchemy import (
    func,
    select,
    delete,
    update,
    exists,
    and_,
    asc,
    desc,
    or_
)
from sqlalchemy.orm import selectin_polymorphic, selectinload, aliased
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm
from papermerge.core.db.exceptions import ResourceHasNoOwner
from papermerge.core.exceptions import EntityNotFound
from papermerge.core.db.common import get_descendants
from papermerge.core.types import PaginatedResponse, ResourceType, OwnerType, \
    NodeResource, TagResource, Owner
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.features.nodes import events
from papermerge.core.features.nodes.schema import DeleteDocumentsData
from papermerge.core.features.ownership.db.orm import Ownership
from papermerge.core.db.common import (
    get_ancestors,
    get_shared_root_for_user,
    truncate_breadcrumb_at_shared_root,
    get_breadcrumb_root_type,
)
from papermerge.core.schemas.common import Breadcrumb
from .orm import Folder

logger = logging.getLogger(__name__)

async def load_node(db_session: AsyncSession, node: orm.Node) -> orm.Document | orm.Folder:
    if node.ctype == 'document':
        stmt = select(orm.Document).options(
            selectinload(orm.Document.versions).selectinload(orm.DocumentVersion.pages)
        ).where(orm.Document.id == node.id)
        result =  await db_session.execute(stmt)
        return result.scalar_one()

    stmt = select(orm.Folder).where(orm.Folder.id == node.id)
    result = await db_session.execute(stmt)
    return result.scalar_one()


async def load_folder(db_session: AsyncSession, folder: orm.Folder) -> orm.Folder:
    stmt = select(orm.Folder).options(
        selectinload(orm.Folder.tags)
    ).where(orm.Folder.id == folder.id)
    result = await db_session.execute(stmt)
    return result.scalar_one()


def str2colexpr(keys: list[str]):
    result = []
    ORDER_BY_MAP = {
        "ctype": orm.Node.ctype,
        "-ctype": orm.Node.ctype.desc(),
        "title": orm.Node.title,
        "-title": orm.Node.title.desc(),
        "created_at": orm.Node.created_at,
        "-created_at": orm.Node.created_at.desc(),
        "updated_at": orm.Node.updated_at,
        "-updated_at": orm.Node.updated_at.desc(),
    }
    logger.debug(f"str2colexpr keys = {keys}")

    for key in keys:
        item = ORDER_BY_MAP.get(key, orm.Node.title)
        result.append(item)

    return result


async def get_nodes(
    db_session: AsyncSession,
    node_ids: list[UUID] | None = None,
    user_id: UUID | None = None,
) -> list[schema.Document | schema.Folder]:
    """
    Get nodes by IDs with user-aware breadcrumbs.

    Args:
        db_session: Database session
        node_ids: List of node IDs to retrieve (empty list returns all nodes)
        user_id: Current user ID for breadcrumb truncation. If provided,
                 breadcrumbs will be truncated for shared access.
    """
    items = []
    if node_ids is None:
        node_ids = []

    if len(node_ids) > 0:
        stmt = (
            select(orm.Node)
            .options(selectinload(orm.Node.tags))
            .filter(orm.Node.id.in_(node_ids))
        )
    else:
        stmt = select(orm.Node).options(selectinload(orm.Node.tags))

    nodes = (await db_session.scalars(stmt)).all()

    for node in nodes:
        # Get full breadcrumb
        full_breadcrumb = await get_ancestors(db_session, node.id, include_self=False)

        # Determine if we need to truncate for shared access
        shared_root_id = None
        if user_id is not None:
            shared_root_id = await get_shared_root_for_user(
                db_session, node_id=node.id, user_id=user_id
            )

        if shared_root_id is not None:
            path = truncate_breadcrumb_at_shared_root(full_breadcrumb, shared_root_id)
        else:
            path = full_breadcrumb

        # Determine root type for frontend rendering
        root_type = await get_breadcrumb_root_type(
            db_session, full_breadcrumb, shared_root_id
        )

        node = await load_node(db_session, node)
        node.breadcrumb = Breadcrumb(path=path, root=root_type)

        if node.ctype == "folder":
            items.append(schema.Folder.model_validate(node))
        else:
            items.append(schema.Document.model_validate(node))

    return items

async def get_folder_by_id(db_session: AsyncSession, id: uuid.UUID) -> schema.Folder:
    stmt = select(Folder).where(Folder.id == id)
    db_folder = (await db_session.scalars(stmt)).one_or_none()
    return schema.Folder.model_validate(db_folder)


async def get_paginated_nodes(
    db_session: AsyncSession,
    parent_id: UUID,
    page_size: int,
    page_number: int,
    sort_by: str | None = None,
    sort_direction: str | None = None,
    filters: dict | None = None,
    include_deleted: bool = False,
) -> PaginatedResponse[Union[schema.DocumentEx, schema.FolderEx]]:
    """
    Get paginated nodes with filtering, sorting, and audit trail support.

    Args:
        db_session: Database session
        parent_id: Parent folder ID
        page_size: Number of items per page
        page_number: Page number (1-based)
        sort_by: Column to sort by
        sort_direction: Sort direction ('asc' or 'desc')
        filters: Dictionary of filters with format:
            {
                "filter_name": {
                    "value": filter_value,
                    "operator": "free_text" | "in" | "eq" | etc.
                }
            }
        include_deleted: Whether to include soft-deleted nodes

    Returns:
        Paginated response with nodes including full audit trail and ownership
    """
    loader_opt = selectin_polymorphic(orm.Node, [Folder, orm.Document])

    # Create user aliases for all audit trail joins
    created_user = aliased(orm.User, name='created_user')
    updated_user = aliased(orm.User, name='updated_user')
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Subquery for is_shared check
    subq = exists().where(orm.SharedNode.node_id == orm.Node.id)

    # Build base query with ownership and audit user joins
    base_query = (
        select(orm.Node, subq.label("is_shared"))
        .options(selectinload(orm.Node.tags))
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.NODE.value,
                Ownership.resource_id == orm.Node.id
            )
        )
        .join(created_user, orm.Node.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Node.updated_by == updated_user.id, isouter=True)
        .join(
            owner_user,
            and_(
                Ownership.owner_type == OwnerType.USER.value,
                Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        .join(
            owner_group,
            and_(
                Ownership.owner_type == OwnerType.GROUP.value,
                Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
    )

    # Build where conditions
    where_conditions = [orm.Node.parent_id == parent_id]

    # Exclude deleted entries unless explicitly requested
    if not include_deleted:
        where_conditions.append(orm.Node.deleted_at.is_(None))

    # Apply filters
    if filters:
        filter_conditions = _build_node_filter_conditions(
            filters, created_user, updated_user, owner_user, owner_group
        )
        where_conditions.extend(filter_conditions)

    base_query = base_query.where(and_(*where_conditions))

    # Count total items (with same filters)
    count_query = (
        select(func.count(orm.Node.id))
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.NODE.value,
                Ownership.resource_id == orm.Node.id
            )
        )
        .join(created_user, orm.Node.created_by == created_user.id, isouter=True)
        .join(updated_user, orm.Node.updated_by == updated_user.id, isouter=True)
        .where(and_(*where_conditions))
    )

    total_nodes = await db_session.scalar(count_query)

    # Apply sorting
    if sort_by and sort_direction:
        base_query = _apply_node_sorting(
            base_query, sort_by, sort_direction,
            created_user=created_user,
            updated_user=updated_user,
            owner_user=owner_user,
            owner_group=owner_group
        )
    else:
        # Default sorting by ctype then title
        base_query = base_query.order_by(orm.Node.ctype, orm.Node.title)

    # Apply pagination
    offset = page_size * (page_number - 1)

    # Add columns for audit users and ownership
    paginated_query = (
        base_query
        .add_columns(
            Ownership.owner_type.label('owner_type'),
            Ownership.owner_id.label('owner_id'),
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name'),
            created_user.id.label('created_by_id'),
            created_user.username.label('created_by_username'),
            updated_user.id.label('updated_by_id'),
            updated_user.username.label('updated_by_username'),
        )
        .limit(page_size)
        .offset(offset)
        .options(loader_opt)
    )

    # Execute query
    results = (await db_session.execute(paginated_query)).all()

    # Convert to schema models with complete audit trail
    items = []
    num_pages = math.ceil(total_nodes / page_size) if total_nodes > 0 else 1

    for row in results:
        node = row[0]
        is_shared = row.is_shared

        # Build audit user objects
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

        # Build owned_by from ownership data
        if row.owner_type == OwnerType.USER.value:
            owned_by = schema.OwnedBy(
                id=row.owner_user_id,
                name=row.owner_username,
                type=OwnerType.USER
            )
        else:
            owned_by = schema.OwnedBy(
                id=row.owner_group_id,
                name=row.owner_group_name,
                type=OwnerType.GROUP
            )

        if node.ctype == "folder":
            items.append(schema.FolderEx(
                id=node.id,
                title=node.title,
                ctype=node.ctype,
                tags=node.tags,
                parent_id=node.parent_id,
                is_shared=is_shared,
                owned_by=owned_by,
                created_at=node.created_at,
                updated_at=node.updated_at,
                created_by=created_by,
                updated_by=updated_by,
            ))
        else:
            items.append(schema.DocumentEx(
                id=node.id,
                title=node.title,
                ctype=node.ctype,
                tags=node.tags,
                parent_id=node.parent_id,
                is_shared=is_shared,
                owned_by=owned_by,
                created_at=node.created_at,
                updated_at=node.updated_at,
                created_by=created_by,
                updated_by=updated_by,
                preview_status=node.preview_status,
                ocr=node.ocr,
                ocr_status=node.ocr_status,
            ))

    return PaginatedResponse[Union[schema.DocumentEx, schema.FolderEx]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items,
    )


async def update_node(
    db_session: AsyncSession,
    node_id: uuid.UUID,
    attrs: schema.UpdateNode,
) -> schema.NodeShort:
    stmt = select(orm.Node).where(orm.Node.id == node_id)
    node = (await db_session.scalars(stmt)).one()
    if attrs.title is not None:
        node.title = attrs.title

    if attrs.parent_id is not None:
        node.parent_id = attrs.parent_id

    await db_session.commit()
    await db_session.refresh(node)

    return node


async def create_folder(
    db_session: AsyncSession,
    attrs: schema.NewFolder,
    created_by: uuid.UUID
) -> Tuple[schema.FolderShort | None, schema.Error | None]:
    error = None
    folder_id = attrs.id or uuid.uuid4()

    owner_type, owner_id = await ownership_api.get_owner_info(
        db_session,
        resource_id=attrs.parent_id,
        resource_type=ResourceType.NODE
    )

    folder = orm.Folder(
        id=folder_id,
        title=attrs.title,
        parent_id=attrs.parent_id,
        ctype="folder",
        created_by=created_by,
        updated_by=created_by,
    )
    await ownership_api.set_owner(
        db_session,
        resource=NodeResource(id=folder_id),
        owner=Owner(owner_type=owner_type, owner_id=owner_id)
    )

    db_session.add(folder)
    try:
        await db_session.commit()
    except IntegrityError as e:
        error = schema.Error(messages=[str(e)])
        folder = None
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        folder = None

    if folder:
        folder = await load_folder(db_session, folder)
        return schema.FolderShort.model_validate(folder), error

    return None, error


async def assign_node_tags(
    db_session: AsyncSession,
    node_id: uuid.UUID,
    tags: list[str],
    created_by: uuid.UUID,
) -> orm.Node:
    """Will assign tags with given name to the node

    Currently associated node tags not mentioned in the `tags` list will
    be disassociated (but tags won't be deleted).
    """
    loader_opt = selectin_polymorphic(orm.Node, [Folder, orm.Document])
    stmt = select(orm.Node).options(loader_opt).where(orm.Node.id == node_id)
    node = (await db_session.scalars(stmt)).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    # Get node's owner to use for new tags
    node_owner_info = await ownership_api.get_owner_info(
        session=db_session,
        resource_type=ResourceType.NODE,
        resource_id=node_id
    )

    if not node_owner_info:
        raise ResourceHasNoOwner(f"Node {node_id} has no owner")

    node_owner_type, node_owner_id = node_owner_info

    # Get existing tags for this owner
    existing_db_tags_stmt = (
        select(orm.Tag)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.TAG.value,
                orm.Ownership.resource_id == orm.Tag.id
            )
        )
        .where(
            orm.Tag.name.in_(tags),
            orm.Ownership.owner_type == node_owner_type.value,
            orm.Ownership.owner_id == node_owner_id
        )
    )
    existing_db_tags = (await db_session.execute(existing_db_tags_stmt)).scalars()
    existing_db_tags_names = [t.name for t in existing_db_tags.all()]

    # Create new tags if they don't exist (with same owner as node)
    for name in tags:
        if name not in existing_db_tags_names:
            new_tag = orm.Tag(name=name, created_by=created_by, updated_by=created_by)
            db_session.add(new_tag)
            await db_session.flush()

            # Set ownership for new tag
            await ownership_api.set_owner(
                session=db_session,
                resource=TagResource(id=new_tag.id),
                owner=Owner(owner_type=node_owner_type, owner_id=node_owner_id)
            )

    # Get all tags (existing + newly created) and assign to node
    all_tags_stmt = (
        select(orm.Tag)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.TAG.value,
                orm.Ownership.resource_id == orm.Tag.id
            )
        )
        .where(
            orm.Tag.name.in_(tags),
            orm.Ownership.owner_type == node_owner_type.value,
            orm.Ownership.owner_id == node_owner_id
        )
    )
    all_tags = (await db_session.execute(all_tags_stmt)).scalars().all()
    node.tags = all_tags

    try:
        await db_session.flush()
        await db_session.commit()
    except Exception as e:
        await db_session.rollback()
        raise

    return node


async def update_node_tags(
    db_session: AsyncSession,
    node_id: uuid.UUID,
    tags: list[str],
) -> orm.Node:
    stmt = select(orm.Node).where(orm.Node.id == node_id)
    node = (await db_session.scalars(stmt)).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    db_tags = [orm.Tag(name=name) for name in tags]
    db_session.add_all(db_tags)

    await db_session.commit()
    node.tags.extend(db_tags)
    await db_session.commit()

    return node


async def get_node_tags(
        db_session: AsyncSession, node_id: uuid.UUID, user_id: uuid.UUID
) -> Tuple[Iterable[schema.Tag] | None, schema.Error | None]:
    """Retrieves all node's tags with ownership information"""

    # Create aliases for owner user and group
    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    # Subquery to get tag IDs associated with the node
    subq = select(orm.NodeTagsAssociation.tag_id).where(
        orm.NodeTagsAssociation.node_id == node_id
    )

    # Build query with ownership information
    stmt = (
        select(orm.Tag)
        .join(
            Ownership,
            and_(
                Ownership.resource_type == ResourceType.TAG.value,
                Ownership.resource_id == orm.Tag.id
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
        .add_columns(
            # Ownership info
            Ownership.owner_type.label('owner_type'),
            Ownership.owner_id.label('owner_id'),
            # Owner user info
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            # Owner group info
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name')
        )
        .where(orm.Tag.id.in_(subq))
    )

    try:
        result = await db_session.execute(stmt)
        rows = result.all()

        tags = []
        for row in rows:
            tag = row[0]  # The Tag object

            # Build owned_by from ownership data
            if row.owner_type == OwnerType.USER.value:
                owned_by = schema.OwnedBy(
                    id=row.owner_id,
                    name=row.owner_username,
                    type="user"
                )
            else:  # OwnerType.GROUP
                owned_by = schema.OwnedBy(
                    id=row.owner_id,
                    name=row.owner_group_name,
                    type="group"
                )

            # Build tag dict with owned_by
            tag_dict = {
                "id": tag.id,
                "name": tag.name,
                "bg_color": tag.bg_color,
                "fg_color": tag.fg_color,
                "owned_by": owned_by,
                # Add any other fields required by your Tag schema
            }

            tags.append(schema.Tag(**tag_dict))

    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return tags, None


async def remove_node_tags(
    db_session: AsyncSession, node_id: uuid.UUID, tags: list[str], user_id: uuid.UUID
) -> orm.Node:
    """Disassociates node tags"""
    stmt = select(orm.Node).where(orm.Node.id == node_id)
    node = (await db_session.scalars(stmt)).one_or_none()

    if node is None:
        raise EntityNotFound(f"Node {node_id} not found")

    tag_ids = select(orm.Tag.id).where(orm.Tag.name.in_(tags))
    delete_stmt = delete(orm.NodeTagsAssociation).where(
        orm.NodeTagsAssociation.tag_id.in_(tag_ids),
        orm.NodeTagsAssociation.node_id == node_id,
    )

    await db_session.execute(delete_stmt)
    await db_session.commit()

    return node


async def get_folder(
    db_session: AsyncSession,
    folder_id: UUID,
    user_id: UUID,
) -> orm.Folder:
    # Get full breadcrumb first
    full_breadcrumb = await get_ancestors(db_session, folder_id)

    # Check if we need to truncate for shared access
    shared_root_id = await get_shared_root_for_user(
        db_session, node_id=folder_id, user_id=user_id
    )

    if shared_root_id is not None:
        path = truncate_breadcrumb_at_shared_root(full_breadcrumb, shared_root_id)
    else:
        path = full_breadcrumb

    # Determine root type for frontend rendering
    root_type = await get_breadcrumb_root_type(db_session, full_breadcrumb, shared_root_id)

    owner_user = aliased(orm.User, name='owner_user')
    owner_group = aliased(orm.Group, name='owner_group')

    stmt = (
        select(orm.Folder)
        .select_from(orm.Folder)
        .join(
            orm.Ownership,
            and_(
                orm.Ownership.resource_type == ResourceType.NODE.value,
                orm.Ownership.resource_id == orm.Folder.id
            )
        )
        .join(
            owner_user,
            and_(
                orm.Ownership.owner_type == OwnerType.USER,
                orm.Ownership.owner_id == owner_user.id
            ),
            isouter=True
        )
        .join(
            owner_group,
            and_(
                orm.Ownership.owner_type == OwnerType.GROUP,
                orm.Ownership.owner_id == owner_group.id
            ),
            isouter=True
        )
        .add_columns(
            orm.Ownership.owner_type,
            orm.Ownership.owner_id,
            owner_user.id.label('owner_user_id'),
            owner_user.username.label('owner_username'),
            owner_group.id.label('owner_group_id'),
            owner_group.name.label('owner_group_name')
        )
        .where(orm.Folder.id == folder_id)
    )

    result = await db_session.execute(stmt)
    row = result.first()

    if row is None:
        raise ValueError(f"Folder {folder_id} not found")

    folder = row[0]
    folder.breadcrumb = Breadcrumb(path=path, root=root_type)

    if row.owner_type == OwnerType.USER:
        owned_by = schema.OwnedBy(
            id=row.owner_user_id,
            name=row.owner_username,
            type=OwnerType.USER
        )
    else:
        owned_by = schema.OwnedBy(
            id=row.owner_group_id,
            name=row.owner_group_name,
            type=OwnerType.GROUP
        )

    folder.owned_by = owned_by

    return folder


async def delete_nodes(
    db_session: AsyncSession, node_ids: list[UUID], user_id: UUID
) -> schema.Error | None:
    all_ids_to_be_deleted = [
        item[0] for item in await get_descendants(db_session, node_ids=node_ids)
    ]

    delete_details = await prepare_documents_s3_data_deletion(
        db_session, all_ids_to_be_deleted
    )

    stmt = delete(orm.Node).where(orm.Node.id.in_(all_ids_to_be_deleted))

    # This second delete statement - is extra hack for Sqlite DB
    # For some reason, the (Polymorphic?) cascading does not work
    # in Sqlite, so here it is required to manually delete associated
    # custom fields
    sqlite_hack_stmt = delete(orm.CustomFieldValue).where(
        orm.CustomFieldValue.document_id.in_(all_ids_to_be_deleted)
    )

    try:
        await db_session.execute(stmt)
        await db_session.execute(sqlite_hack_stmt)
        await db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return error

    events.delete_documents_s3_data(delete_details)
    return None


async def move_nodes(
    db_session: AsyncSession,
    source_ids: list[UUID],
    target_id: UUID
) -> int:
    stmt = select(orm.Node).where(orm.Node.id == target_id)
    target = (await db_session.execute(stmt)).scalar()
    descendants_ids = [
        item[0] for item in await get_descendants(db_session, node_ids=source_ids)
    ]
    if target is None:
        raise EntityNotFound("Node target not found")

    stmt = (
        update(orm.Node).where(orm.Node.id.in_(source_ids)).values(parent_id=target_id)
    )
    owner_type, owner_id = await ownership_api.get_owner_info(
        db_session,
        resource_type=ResourceType.NODE,
        resource_id=target_id
    )
    result = await db_session.execute(stmt)
    await ownership_api.set_owners(
        db_session,
        resource_type=ResourceType.NODE,
        resource_ids=descendants_ids,
        owner=Owner(owner_type=owner_type, owner_id=owner_id),
    )
    await db_session.commit()

    return result.rowcount


async def prepare_documents_s3_data_deletion(
    db_session: AsyncSession, node_ids: list[UUID]
) -> DeleteDocumentsData:
    """Extract information from the list of `node_ids` about to be deleted

    Note: all nodes from `node_ids` are about to be deleted

    Extracts a list of document IDs which are about to be deleted.

    Extracts a list of document version IDs belonging to the document
    IDs which are about to be deleted.

    Extracts a list of page IDs belonging to the document versions
    which are about to be deleted
    """
    stmt = (
        select(orm.Document.id, orm.DocumentVersion.id, orm.Page.id)
        .select_from(orm.Document)
        .join(orm.DocumentVersion)
        .join(orm.Page)
        .where(orm.Document.id.in_(node_ids))
    )
    doc_ids = set()
    page_ids = set()
    doc_ver_ids = set()

    for row in await db_session.execute(stmt):
        doc_ids.add(row[0])
        doc_ver_ids.add(row[1])
        page_ids.add(row[2])

    return DeleteDocumentsData(
        document_ids=list(doc_ids),
        page_ids=list(page_ids),
        document_version_ids=list(doc_ver_ids),
    )


def _build_node_filter_conditions(
    filters: dict,
    created_user,
    updated_user,
    owner_user,
    owner_group
) -> list:
    """Build SQLAlchemy filter conditions from filter dict."""
    conditions = []

    for filter_name, filter_config in filters.items():
        value = filter_config.get("value")
        operator = filter_config.get("operator", "eq")

        if filter_name == "free_text" and operator == "free_text":
            # Search in title
            conditions.append(
                func.lower(orm.Node.title).contains(
                    value.strip().lower(), autoescape=True
                )
            )
        elif filter_name == "ctype":
            if operator == "in":
                ctypes = [c.strip() for c in value.split(",")]
                conditions.append(orm.Node.ctype.in_(ctypes))
            else:
                conditions.append(orm.Node.ctype == value)
        elif filter_name == "created_by_username":
            if operator == "in":
                usernames = [u.strip() for u in value.split(",")]
                conditions.append(created_user.username.in_(usernames))
            else:
                conditions.append(created_user.username == value)
        elif filter_name == "updated_by_username":
            if operator == "in":
                usernames = [u.strip() for u in value.split(",")]
                conditions.append(updated_user.username.in_(usernames))
            else:
                conditions.append(updated_user.username == value)
        elif filter_name == "owner_name":
            conditions.append(
                or_(
                    owner_user.username.ilike(f"%{value}%"),
                    owner_group.name.ilike(f"%{value}%")
                )
            )

    return conditions


def _apply_node_sorting(
    query,
    sort_by: str,
    sort_direction: str,
    created_user,
    updated_user,
    owner_user,
    owner_group
):
    """Apply sorting to the query."""
    direction = desc if sort_direction == "desc" else asc

    sort_columns = {
        "id": orm.Node.id,
        "title": orm.Node.title,
        "ctype": orm.Node.ctype,
        "created_at": orm.Node.created_at,
        "updated_at": orm.Node.updated_at,
        "created_by": created_user.username,
        "updated_by": updated_user.username,
        "owned_by": func.coalesce(owner_user.username, owner_group.name),
    }

    sort_column = sort_columns.get(sort_by, orm.Node.title)
    return query.order_by(direction(sort_column))
