import uuid
from typing import Tuple

from sqlalchemy import select
from sqlalchemy.exc import NoResultFound, IntegrityError

from papermerge.core.exceptions import EntityNotFound
from papermerge.core.db.engine import Session

from papermerge.core.features.tags import schema
from papermerge.core.features.tags.db import orm
from papermerge.core.schemas import error as err_schema


def get_tags(
    db_session: Session, user_id: uuid.UUID, order_by: list[str]
) -> list[schema.Tag]:
    stmt = select(orm.Tag).where(orm.Tag.user_id == user_id).order_by(*order_by)
    db_items = db_session.scalars(stmt).all()
    result = [schema.Tag.model_validate(db_item) for db_item in db_items]

    return result


def get_tag(
    db_session: Session, tag_id: uuid.UUID, user_id: uuid.UUID
) -> Tuple[schema.Tag | None, err_schema.Error | None]:

    stmt = select(orm.Tag).where(orm.Tag.user_id == user_id, orm.Tag.id == id)
    try:
        db_item = db_session.execute(stmt)
    except NoResultFound:
        raise EntityNotFound
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    return schema.Tag.model_validate(db_item), None


def create_tag(
    db_session, attrs: schema.CreateTag, user_id: uuid.UUID
) -> Tuple[schema.Tag | None, err_schema.Error | None]:

    db_tag = orm.Tag(user_id=user_id, **attrs.model_dump())
    db_session.add(db_tag)

    try:
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    return schema.Tag.model_validate(db_tag), None


def update_tag(
    db_session, attrs: schema.UpdateTag, user_id: uuid.UUID
) -> Tuple[schema.Tag | None, err_schema.Error | None]:

    db_tag = orm.Tag(user_id=user_id, **attrs.model_dump())
    db_session.add(db_tag)

    try:
        db_session.commit()
    except Exception as e:
        error = err_schema.Error(messages=[str(e)])
        return None, error

    return schema.Tag.model_validate(db_tag), None


def delete_tag(
    db_session: Session,
    tag_id: uuid.UUID,
    user_id: uuid.UUID,
):
    stmt = select(orm.Tag).where(orm.Tag.id == tag_id, orm.Tag.user_id == user_id)
    try:
        tag = db_session.execute(stmt, params={"id": tag_id}).scalars().one()
        db_session.delete(tag)
        db_session.commit()
    except NoResultFound:
        raise EntityNotFound()
