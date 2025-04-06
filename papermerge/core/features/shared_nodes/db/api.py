import uuid
import math
from itertools import zip_longest


from typing import Union

from sqlalchemy import select, or_, func
from sqlalchemy.orm import aliased, selectin_polymorphic, selectinload

from papermerge.core.db.engine import Session
from papermerge.core.features.shared_nodes import schema as sn_schema
from papermerge.core.features.shared_nodes.db import orm as sn_orm
from papermerge.core.types import PaginatedResponse
from papermerge.core import orm, schema


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


def create_shared_nodes(
    db_session: Session,
    node_ids: list[uuid.UUID],
    role_ids: list[uuid.UUID],
    owner_id: uuid.UUID,
    user_ids: list[uuid.UUID] | None = None,
    group_ids: list[uuid.UUID] | None = None,
) -> [list[sn_schema.SharedNode] | None, str | None]:
    if user_ids is None:
        user_ids = []

    if group_ids is None:
        group_ids = []

    shared_nodes = []
    for node_id in node_ids:
        for user_id, group_id in zip_longest(user_ids, group_ids):
            for role_id in role_ids:
                shared_nodes.append(
                    sn_orm.SharedNode(
                        node_id=node_id,
                        user_id=user_id,
                        role_id=role_id,
                        group_id=group_id,
                        owner_id=owner_id,
                    )
                )

    db_session.add_all(shared_nodes)
    db_session.commit()

    return shared_nodes, None


def get_paginated_shared_nodes(
    db_session: Session,
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

    base_stmt = (
        select(orm.Node, orm.Permission.codename)
        .select_from(orm.SharedNode)
        .options(selectinload(orm.Node.tags))
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

    if filter:
        stmt = base_stmt.where(
            func.lower(orm.Node.title).contains(filter.strip().lower(), autoescape=True)
        )
    else:
        stmt = base_stmt

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_nodes = db_session.scalar(count_stmt)
    num_pages = math.ceil(total_nodes / page_size)
    paginated_stmt = (
        stmt.offset((page_number - 1) * page_size)
        .order_by(*str2colexpr(order_by))
        .limit(page_size)
        .options(loader_opt)
    )

    items = []

    def _is_folder(item: orm.Folder, folder_id: uuid.UUID) -> bool:
        return item.id == folder_id

    for row in db_session.execute(paginated_stmt):
        folder_id = row.Node.id
        found = next((item for item in items if _is_folder(item, folder_id)), None)

        if found:
            found.perms.append(row.codename)
            continue

        if row.Node.ctype == "folder":
            new_item = schema.Folder.model_validate(row.Node)
            new_item.perms = [row.codename]
            items.append(new_item)
        else:
            items.append(schema.Document.model_validate(row.Node))

    return PaginatedResponse[Union[schema.Document, schema.Folder]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items,
    )


def get_shared_node_access_details(
    db_session: Session, node_id: uuid.UUID
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
    for row in db_session.execute(stmt):
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
                    id=row.user_id, name=row.group_name, roles=[role]
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
