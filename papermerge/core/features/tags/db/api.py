import uuid
import math
from typing import Tuple

from sqlalchemy import select, update, func, or_
from sqlalchemy.exc import NoResultFound
from sqlalchemy.orm import aliased

from papermerge.core.exceptions import EntityNotFound
from papermerge.core.db.engine import Session

from papermerge.core import schema
from papermerge.core import orm

ORDER_BY_MAP = {
    "name": orm.Tag.name.asc(),
    "-name": orm.Tag.name.desc(),
    "pinned": orm.Tag.pinned.asc(),
    "-pinned": orm.Tag.pinned.desc(),
    "description": orm.Tag.id.asc(),
    "-description": orm.Tag.id.desc(),
    "ID": orm.Tag.id.asc(),
    "-ID": orm.Tag.id.desc(),
    "group_name": orm.Group.name.asc(),
    "-group_name": orm.Group.name.desc(),
}


def get_tags_without_pagination(
    db_session: Session,
    *,
    user_id: uuid.UUID | None = None,
    group_id: uuid.UUID | None = None,
) -> list[schema.Tag]:
    if group_id:
        stmt = select(orm.Tag).where(orm.Tag.group_id == group_id)
    elif user_id:
        stmt = select(orm.Tag).where(orm.Tag.user_id == user_id)
    else:
        raise ValueError("Both: group_id and user_id are missing")

    db_items = db_session.scalars(stmt).all()
    result = [schema.Tag.model_validate(db_item) for db_item in db_items]

    return result


def get_tags(
    db_session: Session,
    *,
    user_id: uuid.UUID,
    page_size: int,
    page_number: int,
    filter: str | None = None,
    order_by: str = "name",
) -> schema.PaginatedResponse[schema.Tag]:

    UserGroupAlias = aliased(orm.user_groups_association)
    subquery = select(UserGroupAlias.c.group_id).where(
        UserGroupAlias.c.user_id == user_id
    )

    stmt_total_tags = select(func.count(orm.Tag.id)).where(
        or_(orm.Tag.user_id == user_id, orm.Tag.group_id.in_(subquery))
    )

    if filter:
        stmt_total_tags = stmt_total_tags.where(
            or_(
                orm.Tag.name.icontains(filter),
                orm.Tag.description.icontains(filter),
            )
        )

    total_tags = db_session.execute(stmt_total_tags).scalar()
    order_by_value = ORDER_BY_MAP.get(order_by, orm.Tag.name.asc())

    offset = page_size * (page_number - 1)
    stmt = (
        select(
            orm.Tag,
            orm.Group.name.label("group_name"),
            orm.Group.id.label("group_id"),
        )
        .join(orm.Group, orm.Group.id == orm.Tag.group_id, isouter=True)
        .where(
            or_(
                orm.Tag.user_id == user_id,
                orm.Tag.group_id.in_(subquery),
            )
        )
        .limit(page_size)
        .offset(offset)
        .order_by(order_by_value)
    )

    if filter:
        stmt = stmt.where(
            or_(
                orm.Tag.name.icontains(filter),
                orm.Tag.description.icontains(filter),
            )
        )

    items = []
    for row in db_session.execute(stmt):
        kwargs = {
            "id": row.Tag.id,
            "name": row.Tag.name,
            "bg_color": row.Tag.bg_color,
            "fg_color": row.Tag.fg_color,
            "description": row.Tag.description,
            "pinned": row.Tag.pinned,
        }
        if row.group_name and row.group_id:
            kwargs["group_id"] = row.group_id
            kwargs["group_name"] = row.group_name

        items.append(schema.Tag(**kwargs))

    total_pages = math.ceil(total_tags / page_size)

    return schema.PaginatedResponse[schema.Tag](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


def get_tag(
    db_session: Session, tag_id: uuid.UUID
) -> Tuple[schema.Tag | None, schema.Error | None]:

    stmt = (
        select(orm.Tag, orm.Group)
        .join(orm.Group, orm.Group.id == orm.Tag.group_id, isouter=True)
        .where(orm.Tag.id == tag_id)
    )
    try:
        row = db_session.execute(stmt).unique().one()
        kwargs = {
            "id": row.Tag.id,
            "name": row.Tag.name,
            "bg_color": row.Tag.bg_color,
            "fg_color": row.Tag.fg_color,
            "description": row.Tag.description,
            "pinned": row.Tag.pinned,
        }

        if row.Group and row.Group.id:
            kwargs["group_id"] = row.Group.id
            kwargs["group_name"] = row.Group.name
    except NoResultFound:
        raise EntityNotFound
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    if row is None:
        raise EntityNotFound

    return schema.Tag.model_validate(kwargs), None


def create_tag(
    db_session, attrs: schema.CreateTag
) -> Tuple[schema.Tag | None, schema.Error | None]:

    db_tag = orm.Tag(**attrs.model_dump())
    db_session.add(db_tag)

    try:
        db_session.commit()
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return schema.Tag.model_validate(db_tag), None


def update_tag(
    db_session, tag_id: uuid.UUID, attrs: schema.UpdateTag
) -> Tuple[schema.Tag | None, schema.Error | None]:

    stmt = select(orm.Tag).where(orm.Tag.id == tag_id)
    tag = db_session.execute(stmt).scalars().one()
    db_session.add(tag)

    if attrs.name:
        tag.name = attrs.name

    if attrs.fg_color:
        tag.fg_color = attrs.fg_color

    if attrs.bg_color:
        tag.bg_color = attrs.bg_color

    if attrs.description:
        tag.description = attrs.description

    if attrs.group_id:
        tag.user_id = None
        tag.group_id = attrs.group_id
    elif attrs.user_id:
        tag.user_id = attrs.user_id
        tag.group_id = None
    else:
        raise ValueError(
            "Either attrs.user_id or attrs.group_id should be non-empty value"
        )

    try:
        db_session.commit()
        db_tag = db_session.get(orm.Tag, tag_id)
    except Exception as e:
        error = schema.Error(messages=[str(e)])
        return None, error

    return schema.Tag.model_validate(db_tag), None


def delete_tag(
    db_session: Session,
    tag_id: uuid.UUID,
):
    stmt = select(orm.Tag).where(orm.Tag.id == tag_id)
    try:
        tag = db_session.execute(stmt, params={"id": tag_id}).scalars().one()
        db_session.delete(tag)
        db_session.commit()
    except NoResultFound:
        raise EntityNotFound()
