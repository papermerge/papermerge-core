import logging
import math
import uuid
from typing import Tuple

from sqlalchemy import delete, select, func
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm
from papermerge.core.features.auth import scopes

logger = logging.getLogger(__name__)


async def get_role(db_session: AsyncSession, role_id: uuid.UUID) -> schema.RoleDetails:
    stmt = (
        select(orm.Role)
        .options(joinedload(orm.Role.permissions))
        .where(orm.Role.id == role_id)
    )
    db_item = (await db_session.scalars(stmt)).unique().one()
    db_item.scopes = sorted([p.codename for p in db_item.permissions])
    result = schema.RoleDetails.model_validate(db_item)

    return result


async def get_roles(
    db_session: AsyncSession, *, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.Role]:
    stmt_total_users = select(func.count(orm.Role.id))
    total_roles = (db_session.execute(stmt_total_users)).scalar()

    offset = page_size * (page_number - 1)
    stmt = select(orm.Role).limit(page_size).offset(offset)

    db_roles = (await db_session.scalars(stmt)).all()
    items = [schema.Role.model_validate(db_role) for db_role in db_roles]

    total_pages = math.ceil(total_roles / page_size)

    return schema.PaginatedResponse[schema.Role](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


async def get_roles_without_pagination(db_session: AsyncSession) -> list[schema.Role]:
    stmt = select(orm.Role)

    db_roles = (await db_session.scalars(stmt)).all()
    items = [schema.Role.model_validate(db_role) for db_role in db_roles]

    return items


async def create_role(
    db_session: AsyncSession, name: str, scopes: list[str], exists_ok: bool = False
) -> Tuple[schema.Role | None, str | None]:
    """Creates a role with given scopes"""
    stmt_total_permissions = select(func.count(orm.Permission.id))
    perms_count = (await db_session.execute(stmt_total_permissions)).scalar()
    if perms_count == 0:
        error = (
            "There are no permissions in the system."
            " Did you forget to run `paper-cli perms sync`?"
        )
        return None, error

    if exists_ok:
        stmt = select(orm.Role).where(orm.Role.name == name)
        result = (await db_session.execute(stmt)).scalars().all()
        if len(result) >= 1:
            logger.info(f"Role {name} already exists")
            return schema.Role.model_validate(result[0]), None

    stmt = select(orm.Permission).where(orm.Permission.codename.in_(scopes))
    perms = (await db_session.execute(stmt)).scalars().all()

    if len(perms) != len(scopes):
        error = f"Some of the permissions did not match scopes. {perms=} {scopes=}"
        return None, error

    role = orm.Role(name=name, permissions=perms)
    db_session.add(role)
    try:
        await db_session.commit()
    except Exception as e:
        error_msg = str(e)
        if "UNIQUE constraint failed" in error_msg:
            return None, "Role already exists"

    result = schema.Role.model_validate(role)

    return result, None


async def update_role(
    db_session: AsyncSession, role_id: uuid.UUID, attrs: schema.UpdateRole
) -> schema.RoleDetails:
    stmt = select(orm.Permission).where(orm.Permission.codename.in_(attrs.scopes))
    perms = db_session.execute(stmt).scalars().all()

    stmt = select(orm.Role).where(orm.Role.id == role_id)
    role = (await db_session.execute(stmt, params={"id": role_id})).scalars().one()
    db_session.add(role)
    role.name = attrs.name
    role.permissions = perms

    await db_session.commit()

    result = schema.RoleDetails(
        id=role.id, name=role.name, scopes=[p.codename for p in perms]
    )

    return result


async def delete_role(
    db_session: AsyncSession,
    role_id: uuid.UUID,
):
    stmt = select(orm.Role).where(orm.Role.id == role_id)
    role = (await db_session.execute(stmt, params={"id": role_id})).scalars().one()
    await db_session.delete(role)
    await db_session.commit()


async def get_perms(db_session: AsyncSession) -> list[schema.Permission]:
    with db_session as session:
        db_perms = session.scalars(select(orm.Permission).order_by("codename"))
        model_perms = [
            schema.Permission.model_validate(db_perm) for db_perm in db_perms
        ]

    return model_perms


async def sync_perms(db_session: AsyncSession):
    """Syncs `core.auth.scopes.SCOPES` with `auth_permissions` table

    In other words makes sure that all scopes defined in
    `core.auth.scopes.SCOPES` are in `auth_permissions` table and other way
    around - any permission found in db table is also in
    `core.auth.scopes.SCOPES`.
    """
    # A. add missing scopes to perms table
    scopes_to_be_added = []
    db_perms = await db_session.scalars(select(orm.Permission))
    model_perms = [schema.Permission.model_validate(db_perm) for db_perm in db_perms]
    perms_codenames = [perm.codename for perm in model_perms]

    # collect missing scopes
    for codename, desc in scopes.SCOPES.items():
        if codename not in perms_codenames:
            scopes_to_be_added.append((codename, desc))
    # add missing scopes
    for scope in scopes_to_be_added:
        db_session.add(orm.Permission(codename=scope[0], name=scope[1]))
    await db_session.commit()

    # B. removes permissions not present in scopes

    scope_codenames = [scope for scope in scopes.SCOPES.keys()]

    stmt = delete(orm.Permission).where(orm.Permission.codename.notin_(scope_codenames))
    await db_session.execute(stmt)
    await db_session.commit()
