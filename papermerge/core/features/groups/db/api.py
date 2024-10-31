import logging

from sqlalchemy import delete, select
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import joinedload

from papermerge.core.auth import scopes
from papermerge.core.db.engine import Session
from papermerge.core.db.models import ContentType
from papermerge.core.features.groups import schema
from papermerge.core.features.groups.db import orm

logger = logging.getLogger(__name__)


def get_group(db_session: Session, group_id: int) -> schema.GroupDetails:
    stmt = (
        select(orm.Group)
        .options(joinedload(orm.Group.permissions))
        .where(orm.Group.id == group_id)
    )
    db_item = db_session.scalars(stmt).unique().one()
    db_item.scopes = [p.codename for p in db_item.permissions]
    result = schema.GroupDetails.model_validate(db_item)

    return result


def get_groups(db_session: Session) -> list[schema.Group]:
    stmt = select(orm.Group)
    db_items = db_session.scalars(stmt).all()
    result = [schema.Group.model_validate(db_item) for db_item in db_items]

    return result


def create_group(
    db_session: Session, name: str, scopes: list[str], exists_ok: bool = False
) -> schema.Group:
    if exists_ok:
        stmt = select(orm.Group).where(orm.Group.name == name)
        result = db_session.execute(stmt).scalars().all()
        if len(result) >= 1:
            logger.info(f"Group {name} already exists")
            return schema.Group.model_validate(result[0])

    stmt = select(orm.Permission).where(orm.Permission.codename.in_(scopes))
    perms = db_session.execute(stmt).scalars().all()
    group = orm.Group(name=name, permissions=perms)
    db_session.add(group)
    db_session.commit()
    result = schema.Group.model_validate(group)

    return result


def update_group(
    db_session: Session, group_id: int, attrs: schema.UpdateGroup
) -> schema.Group:
    stmt = select(orm.Permission).where(orm.Permission.codename.in_(attrs.scopes))
    perms = db_session.execute(stmt).scalars().all()

    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group = db_session.execute(stmt, params={"id": group_id}).scalars().one()
    db_session.add(group)
    group.name = attrs.name
    group.permissions = perms
    db_session.commit()
    result = schema.Group(id=group.id, name=group.name)

    return result


def delete_group(
    db_session: Session,
    group_id: int,
):
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group = db_session.execute(stmt, params={"id": group_id}).scalars().one()
    db_session.delete(group)
    db_session.commit()


def get_perms(db_session: Session) -> list[schema.Permission]:
    with db_session as session:
        db_perms = session.scalars(select(orm.Permission).order_by("codename"))
        model_perms = [
            schema.Permission.model_validate(db_perm) for db_perm in db_perms
        ]

    return model_perms


def sync_perms(db_session: Session):
    """Syncs `core.auth.scopes.SCOPES` with `auth_permissions` table

    In other words makes sure that all scopes defined in
    `core.auth.scopes.SCOPES` are in `auth_permissions` table and other way
    around - any permission found in db table is also in
    `core.auth.scopes.SCOPES`.
    """
    # A. add missing scopes to perms table
    scopes_to_be_added = []
    db_perms = db_session.scalars(select(orm.Permission))
    model_perms = [schema.Permission.model_validate(db_perm) for db_perm in db_perms]
    perms_codenames = [perm.codename for perm in model_perms]

    # collect missing scopes
    for codename, desc in scopes.SCOPES.items():
        if codename not in perms_codenames:
            scopes_to_be_added.append((codename, desc))

    # content type is not used by the application anymore. It is
    # a leftover from Django auth system
    # Here we just add one fake... just to satisfy DB relation integrity
    try:
        content_type = db_session.scalars(
            select(ContentType).where(
                ContentType.app_label == "core",
                ContentType.model == "scope",
            )
        ).one()
    except NoResultFound:
        content_type = None

    if content_type is None:
        content_type = ContentType(app_label="core", model="scope")
    # add missing content type (again, it is not used; legacy table layout)
    db_session.add(content_type)
    # add missing scopes
    for scope in scopes_to_be_added:
        db_session.add(
            orm.Permission(codename=scope[0], name=scope[1], content_type=content_type)
        )
    db_session.commit()

    # B. removes permissions not present in scopes

    scope_codenames = [scope for scope in scopes.SCOPES.keys()]

    stmt = delete(orm.Permission).where(orm.Permission.codename.notin_(scope_codenames))
    db_session.execute(stmt)
    db_session.commit()
