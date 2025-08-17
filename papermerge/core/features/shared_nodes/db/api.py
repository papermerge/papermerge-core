import uuid
import math
from typing import Union, Tuple, Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, delete, tuple_
from sqlalchemy.orm import aliased, selectin_polymorphic, selectinload

from papermerge.core.features.shared_nodes import schema as sn_schema
from papermerge.core.features.shared_nodes.db import orm as sn_orm
from papermerge.core.types import PaginatedResponse
from papermerge.core import orm, schema, dbapi
from papermerge.core.db import common as dbapi_common


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

    for key in keys:
        item = ORDER_BY_MAP.get(key, orm.Node.title)
        result.append(item)

    return result


async def create_shared_nodes(
    db_session: AsyncSession,
    node_ids: list[uuid.UUID],
    role_ids: list[uuid.UUID],
    owner_id: uuid.UUID,
    user_ids: list[uuid.UUID] | None = None,
    group_ids: list[uuid.UUID] | None = None,
) -> Tuple[list[sn_schema.SharedNode] | None, str | None]:
    if user_ids is None:
        user_ids = []

    if group_ids is None:
        group_ids = []

    shared_nodes = []
    for node_id in node_ids:
        for user_id in user_ids:
            for role_id in role_ids:
                shared_nodes.append(
                    sn_orm.SharedNode(
                        node_id=node_id,
                        user_id=user_id,
                        role_id=role_id,
                        group_id=None,
                        owner_id=owner_id,
                    )
                )
        for group_id in group_ids:
            for role_id in role_ids:
                shared_nodes.append(
                    sn_orm.SharedNode(
                        node_id=node_id,
                        user_id=None,
                        role_id=role_id,
                        group_id=group_id,
                        owner_id=owner_id,
                    )
                )

    db_session.add_all(shared_nodes)
    await db_session.commit()

    return shared_nodes, None


async def get_paginated_shared_nodes(
    db_session: AsyncSession,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    order_by: list[str],
    filter: str | None = None,
) -> PaginatedResponse[schema.Document | schema.Folder]:
    loader_opt = selectin_polymorphic(orm.Node, [orm.Folder, orm.Document])
    UserGroupAlias = aliased(orm.user_groups_association)
    RolePermissionAlias = aliased(orm.roles_permissions_association)
    subquery = select(UserGroupAlias.c.group_id).where(
        UserGroupAlias.c.user_id == user_id
    )

    perms_query = (
        select(orm.Node.id.label("node_id"), orm.Permission.codename)
        .select_from(orm.SharedNode)
        .join(orm.Node, orm.Node.id == orm.SharedNode.node_id)
        .join(orm.Role, orm.Role.id == orm.SharedNode.role_id)
        .join(RolePermissionAlias, RolePermissionAlias.c.role_id == orm.Role.id)
        .join(orm.Permission, orm.Permission.id == RolePermissionAlias.c.permission_id)
        .where(
            or_(
                orm.SharedNode.user_id == user_id,
                orm.SharedNode.group_id.in_(subquery),
            )
        )
    )

    base_stmt = (
        select(orm.Node)
        .select_from(orm.SharedNode)
        .options(selectinload(orm.Node.tags))
        .join(orm.Node, orm.Node.id == orm.SharedNode.node_id)
        .where(
            or_(
                orm.SharedNode.user_id == user_id,
                orm.SharedNode.group_id.in_(subquery),
            )
        )
    )

    if filter:
        stmt = base_stmt.where(
            func.lower(orm.Node.title).contains(filter.strip().lower(), autoescape=True)
        )
    else:
        stmt = base_stmt

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_nodes = await db_session.scalar(count_stmt)

    num_pages = math.ceil(total_nodes / page_size)

    paginated_stmt = (
        stmt.offset((page_number - 1) * page_size)
        .order_by(*str2colexpr(order_by))
        .limit(page_size)
        .options(loader_opt)
    )

    perms = {}
    for row in await db_session.execute(perms_query):

        if perms.get(row.node_id):
            perms[row.node_id].append(row.codename)
        else:
            perms[row.node_id] = [row.codename]

    items = []

    for row in await db_session.execute(paginated_stmt):
        if row.Node.ctype == "folder":
            new_item = schema.Folder.model_validate(row.Node)
        else:
            doc = await dbapi.load_doc(db_session, row.Node.id)
            new_item = schema.Document.model_validate(doc)

        new_item.perms = perms[row.Node.id]
        items.append(new_item)

    return PaginatedResponse[Union[schema.Document, schema.Folder]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items,
    )


async def get_shared_node_ids(
    db_session: AsyncSession,
    user_id: uuid.UUID,
) -> Sequence[uuid.UUID]:
    UserGroupAlias = aliased(orm.user_groups_association)
    subquery = select(UserGroupAlias.c.group_id).where(
        UserGroupAlias.c.user_id == user_id
    )

    stmt = (
        select(orm.Node.id)
        .select_from(orm.SharedNode)
        .join(orm.Node, orm.Node.id == orm.SharedNode.node_id)
        .where(
            or_(
                orm.SharedNode.user_id == user_id,
                orm.SharedNode.group_id.in_(subquery),
            )
        )
    )

    ids = (await db_session.scalars(stmt)).all()

    return ids


async def get_shared_node_access_details(
    db_session: AsyncSession, node_id: uuid.UUID
) -> schema.SharedNodeAccessDetails:
    results = schema.SharedNodeAccessDetails(id=node_id)

    stmt = (
        select(
            orm.SharedNode.user_id,
            orm.User.username,
            orm.SharedNode.group_id,
            orm.Group.name.label("group_name"),
            orm.SharedNode.role_id,
            orm.Role.name.label("role_name"),
        )
        .join(orm.User, orm.User.id == orm.SharedNode.user_id, isouter=True)
        .join(orm.Group, orm.Group.id == orm.SharedNode.group_id, isouter=True)
        .join(orm.Role, orm.Role.id == orm.SharedNode.role_id)
        .where(orm.SharedNode.node_id == node_id)
    )

    users = {}
    groups = {}
    for row in await db_session.execute(stmt):
        if row.user_id is not None:
            if (user := users.get(row.user_id)) is not None:
                user.roles.append(sn_schema.Role(name=row.role_name, id=row.role_id))
            else:
                role = sn_schema.Role(name=row.role_name, id=row.role_id)
                users[row.user_id] = sn_schema.User(
                    id=row.user_id, username=row.username, roles=[role]
                )
        if row.group_id is not None:
            if (group := groups.get(row.group_id)) is not None:
                group.roles.append(sn_schema.Role(name=row.role_name, id=row.role_id))
            else:
                role = sn_schema.Role(name=row.role_name, id=row.role_id)
                groups[row.group_id] = sn_schema.Group(
                    id=row.group_id, name=row.group_name, roles=[role]
                )

    for user_id, user in users.items():
        results.users.append(
            sn_schema.User(
                id=user_id, username=user.username, roles=list(set(user.roles))
            )
        )

    for group_id, group in groups.items():
        results.groups.append(
            sn_schema.Group(id=group_id, name=group.name, roles=list(set(group.roles)))
        )

    return results


async def update_shared_node_access(
    db_session: AsyncSession,
    node_id: uuid.UUID,
    access_update: schema.SharedNodeAccessUpdate,
    owner_id: uuid.UUID,
):
    """
    Update shared nodes access

    More appropriate name for this would be "sync" - because this is
    exactly what it does - it actually syncs content in `access_update` for
    specific node_id to match data in `shared_nodes` table.
    """

    new_user_role_pairs = []
    new_group_role_pairs = []
    for user in access_update.users:
        for role_id in user.role_ids:
            new_user_role_pairs.append((user.id, role_id))

    for group in access_update.groups:
        for role_id in group.role_ids:
            new_group_role_pairs.append((group.id, role_id))

    existing_user_role_pairs = (await db_session.execute(
        select(orm.SharedNode.user_id, orm.SharedNode.role_id).where(
            orm.SharedNode.node_id == node_id
        )
    )).all()
    existing_group_role_pairs = (await db_session.execute(
        select(orm.SharedNode.group_id, orm.SharedNode.role_id).where(
            orm.SharedNode.node_id == node_id
        )
    )).all()

    existing_user_set = set(existing_user_role_pairs)
    desired_user_set = set(new_user_role_pairs)
    existing_group_set = set(existing_group_role_pairs)
    desired_group_set = set(new_group_role_pairs)

    to_add_users = desired_user_set - existing_user_set
    to_remove_users = existing_user_set - desired_user_set
    to_add_groups = desired_group_set - existing_group_set
    to_remove_groups = existing_group_set - desired_group_set

    # Delete removed user pairs
    if to_remove_users:
        await db_session.execute(
            delete(orm.SharedNode).where(
                orm.SharedNode.node_id == node_id,
                tuple_(orm.SharedNode.user_id, orm.SharedNode.role_id).in_(
                    to_remove_users
                ),
            )
        )

    # Delete removed group pairs
    if to_remove_groups:
        await db_session.execute(
            delete(orm.SharedNode).where(
                orm.SharedNode.node_id == node_id,
                tuple_(orm.SharedNode.group_id, orm.SharedNode.role_id).in_(
                    to_remove_groups
                ),
            )
        )

    for user_id, role_id in to_add_users:
        shared = orm.SharedNode(
            node_id=node_id, user_id=user_id, role_id=role_id, owner_id=owner_id
        )
        db_session.add(shared)

    for group_id, role_id in to_add_groups:
        shared = orm.SharedNode(
            node_id=node_id, group_id=group_id, role_id=role_id, owner_id=owner_id
        )
        db_session.add(shared)

    await db_session.commit()


async def get_shared_folder(
    db_session: AsyncSession, folder_id: uuid.UUID, shared_root_id: uuid.UUID
) -> Tuple[orm.Folder | None, schema.Error | None]:
    breadcrumb = await dbapi_common.get_ancestors(db_session, folder_id)
    shorted_breadcrumb = []
    # user will see path only until its ancestor which is marked as shared root
    for b in reversed(breadcrumb):
        shorted_breadcrumb.append(b)
        if b[0] == shared_root_id:
            break

    shorted_breadcrumb.reverse()
    stmt = select(orm.Folder).where(orm.Folder.id == folder_id)
    try:
        db_model = (await db_session.scalars(stmt)).one()
        db_model.breadcrumb = shorted_breadcrumb
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return db_model, None


async def get_shared_doc(
    db_session: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    shared_root_id: uuid.UUID | None = None,
) -> schema.Document:
    db_doc = await dbapi.load_doc(db_session, document_id)
    breadcrumb = await dbapi_common.get_ancestors(db_session, document_id)
    root_shared_node_ids = await get_shared_node_ids(db_session, user_id=user_id)
    shorted_breadcrumb = []
    # user will see path only until its ancestor which is marked as shared root

    for b in reversed(breadcrumb):
        shorted_breadcrumb.append(b)
        if shared_root_id and b[0] == shared_root_id:
            break
        if shared_root_id is None and b[0] in root_shared_node_ids:
            break

    owner = await dbapi_common.get_node_owner(db_session, node_id=document_id)
    shorted_breadcrumb.reverse()

    db_doc.breadcrumb = shorted_breadcrumb
    db_doc.owner_name = owner.name

    # colored_tags = session.scalars(colored_tags_stmt).all()
    # db_doc.tags = [ct.tag for ct in colored_tags]

    model_doc = schema.Document.model_validate(db_doc)

    return model_doc
