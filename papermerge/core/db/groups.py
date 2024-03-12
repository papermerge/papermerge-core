import logging

from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from papermerge.core import schemas
from papermerge.core.db import models

logger = logging.getLogger(__name__)


def get_group(
    engine: Engine,
    group_id: int
) -> schemas.GroupDetails:
    with Session(engine) as session:
        stmt = select(models.Group).where(
            models.Group.id == group_id
        )
        db_item = session.scalars(stmt).one()
        db_item.scopes = [p.codename for p in db_item.permissions]
        result = schemas.GroupDetails.model_validate(
            db_item
        )

    return result


def get_groups(
    engine: Engine
) -> list[schemas.Group]:

    with Session(engine) as session:
        stmt = select(models.Group)
        db_items = session.scalars(stmt).all()
        result = [
            schemas.Group.model_validate(db_item)
            for db_item in db_items
        ]

    return result


def create_group(
    engine: Engine,
    name: str,
    scopes: list[str],
) -> schemas.Group:
    with Session(engine) as session:
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
    engine: Engine,
    group_id: int,
    attrs: schemas.UpdateGroup
):
    with Session(engine) as session:
        stmt = select(models.Permission).where(
            models.Permission.codename.in_(attrs.scopes)
        )
        perms = session.execute(stmt).scalars().all()

        stmt = select(models.Group).where(
            models.Group.id == group_id
        )
        group = session.execute(stmt, params={'id': group_id}).scalars().one()
        group.name = attrs.name
        group.permissions = perms
        session.add(group)
        session.commit()


def delete_group(
    engine: Engine,
    group_id: int,
):
    with Session(engine) as session:
        stmt = select(models.Group).where(
            models.Group.id == group_id
        )
        group = session.execute(stmt, params={'id': group_id}).scalars().one()
        session.delete(group)
        session.commit()
