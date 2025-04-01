import uuid
from itertools import zip_longest

from typing import Union

from sqlalchemy import select, or_
from sqlalchemy.orm import aliased

from papermerge.core.db.engine import Session
from papermerge.core.features.shared_nodes import schema as sn_schema
from papermerge.core.features.shared_nodes.db import orm as sn_orm
from papermerge.core.types import PaginatedResponse
from papermerge.core import orm, schema


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

    shared_nodes = [
        sn_orm.SharedNode(
            node_id=node_id,
            user_id=user_id,
            role_id=role_id,
            group_id=group_id,
            owner_id=owner_id,
        )
        for node_id, user_id, role_id, group_id in zip_longest(
            node_ids,
            user_ids,
            role_ids,
            group_ids,
        )
    ]

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

    UserGroupAlias = aliased(orm.user_groups_association)
    RolePermissionAlias = aliased(orm.roles_permissions_association)
    subquery = select(UserGroupAlias.c.group_id).where(
        UserGroupAlias.c.user_id == user_id
    )

    stmt = (
        select(orm.SharedNode.node_id, orm.Permission.name, orm.Permission.codename)
        .select_from(orm.SharedNode)
        .join(orm.Role, orm.Role.id == orm.SharedNode.role_id)
        .join(RolePermissionAlias, RolePermissionAlias.role_id == orm.Role.id)
        .join(orm.Permission, orm.Permission.id == RolePermissionAlias.permission_id)
        .where(
            or_(
                orm.SharedNode.user_id == user_id, orm.SharedNode.group_id.in_(subquery)
            )
        )
    )

    num_pages = 1
    items = []

    for row in db_session.execute(stmt):
        pass

    return PaginatedResponse[Union[schema.Document, schema.Folder]](
        page_size=page_size,
        page_number=page_number,
        num_pages=num_pages,
        items=items,
    )
