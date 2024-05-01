import logging

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from papermerge.core import schemas
from papermerge.core.db import models

logger = logging.getLogger(__name__)


def get_group(
    db_session: Session,
    group_id: int
) -> schemas.GroupDetails:
    with db_session as session:
        stmt = select(models.Group).options(
            joinedload(models.Group.permissions)
        ).where(
            models.Group.id == group_id
        )
        db_item = session.scalars(stmt).unique().one()
        db_item.scopes = [p.codename for p in db_item.permissions]
        result = schemas.GroupDetails.model_validate(
            db_item
        )

    return result


def get_groups(
    db_session: Session
) -> list[schemas.Group]:

    with db_session as session:
        stmt = select(models.Group)
        db_items = session.scalars(stmt).all()
        result = [
            schemas.Group.model_validate(db_item)
            for db_item in db_items
        ]

    return result


def create_group(
    db_session: Session,
    name: str,
    scopes: list[str],
    exists_ok: bool = False
) -> schemas.Group:
    with db_session as session:
        if exists_ok:
            stmt = select(models.Group).where(
                models.Group.name == name
            )
            result = session.execute(stmt).scalars().all()
            if len(result) >= 1:
                logger.info(f"Group {name} already exists")
                return schemas.Group.model_validate(result[0])

        stmt = select(models.Permission).where(
            models.Permission.codename.in_(scopes)
        )
        perms = session.execute(stmt).scalars().all()
        group = models.Group(
            name=name,
            permissions=perms
        )
        session.add(group)
        session.commit()
        result = schemas.Group.model_validate(group)

    return result


def update_group(
    db_session: Session,
    group_id: int,
    attrs: schemas.UpdateGroup
) -> schemas.Group:
    with db_session as session:
        stmt = select(models.Permission).where(
            models.Permission.codename.in_(attrs.scopes)
        )
        perms = session.execute(stmt).scalars().all()

        stmt = select(models.Group).where(
            models.Group.id == group_id
        )
        group = session.execute(stmt, params={'id': group_id}).scalars().one()
        session.add(group)
        group.name = attrs.name
        group.permissions = perms
        session.commit()
        result = schemas.Group(
            id=group.id,
            name=group.name
        )

    return result


def delete_group(
    db_session: Session,
    group_id: int,
):
    with db_session as session:
        stmt = select(models.Group).where(
            models.Group.id == group_id
        )
        group = session.execute(stmt, params={'id': group_id}).scalars().one()
        session.delete(group)
        session.commit()
