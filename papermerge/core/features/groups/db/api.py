import logging
import math
import uuid

from sqlalchemy import delete, select, func
from sqlalchemy.orm import joinedload

from papermerge.core import schema, orm
from papermerge.core.features.auth import scopes
from papermerge.core.db.engine import Session


logger = logging.getLogger(__name__)


def get_group(db_session: Session, group_id: uuid.UUID) -> schema.GroupDetails:
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    db_item = db_session.scalars(stmt).unique().one()
    result = schema.GroupDetails.model_validate(db_item)

    return result


def get_groups(
    db_session: Session, *, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.Group]:
    stmt_total_users = select(func.count(orm.Group.id))
    total_groups = db_session.execute(stmt_total_users).scalar()

    offset = page_size * (page_number - 1)
    stmt = select(orm.Group).limit(page_size).offset(offset)

    db_groups = db_session.scalars(stmt).all()
    items = [schema.Group.model_validate(db_group) for db_group in db_groups]

    total_pages = math.ceil(total_groups / page_size)

    return schema.PaginatedResponse[schema.Group](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


def get_groups_without_pagination(db_session: Session) -> list[schema.Group]:
    stmt = select(orm.Group)

    db_groups = db_session.scalars(stmt).all()
    items = [schema.Group.model_validate(db_group) for db_group in db_groups]

    return items


def create_group(
    db_session: Session, name: str, scopes: list[str], exists_ok: bool = False
) -> schema.Group:
    if exists_ok:
        stmt = select(orm.Group).where(orm.Group.name == name)
        result = db_session.execute(stmt).scalars().all()
        if len(result) >= 1:
            logger.info(f"Group {name} already exists")
            return schema.Group.model_validate(result[0])

    group = orm.Group(name=name)
    db_session.add(group)
    db_session.commit()
    result = schema.Group.model_validate(group)

    return result


def update_group(
    db_session: Session, group_id: uuid.UUID, attrs: schema.UpdateGroup
) -> schema.Group:
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group = db_session.execute(stmt, params={"id": group_id}).scalars().one()
    db_session.add(group)
    group.name = attrs.name
    db_session.commit()
    result = schema.Group(id=group.id, name=group.name)

    return result


def delete_group(
    db_session: Session,
    group_id: uuid.UUID,
):
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group = db_session.execute(stmt, params={"id": group_id}).scalars().one()
    db_session.delete(group)
    db_session.commit()
