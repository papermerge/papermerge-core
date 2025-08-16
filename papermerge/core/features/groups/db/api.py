import logging
import math
import uuid

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, orm
from papermerge.core import constants

logger = logging.getLogger(__name__)


async def get_group(db_session: AsyncSession, group_id: uuid.UUID) -> schema.GroupDetails:
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    db_item = (await db_session.scalars(stmt)).unique().one()
    result = schema.GroupDetails.model_validate(db_item)

    return result


async def get_groups(
    db_session: AsyncSession, *, page_size: int, page_number: int
) -> schema.PaginatedResponse[schema.Group]:
    stmt_total_users = select(func.count(orm.Group.id))
    total_groups = (await db_session.execute(stmt_total_users)).scalar()

    offset = page_size * (page_number - 1)
    stmt = select(orm.Group).limit(page_size).offset(offset)

    db_groups = (await db_session.scalars(stmt)).all()
    items = [schema.Group.model_validate(db_group) for db_group in db_groups]

    total_pages = math.ceil(total_groups / page_size)

    return schema.PaginatedResponse[schema.Group](
        items=items, page_size=page_size, page_number=page_number, num_pages=total_pages
    )


async def get_groups_without_pagination(db_session: AsyncSession) -> list[schema.Group]:
    stmt = select(orm.Group)

    db_groups = (await db_session.scalars(stmt)).all()
    items = [schema.Group.model_validate(db_group) for db_group in db_groups]

    return items


async def create_group(
    db_session: AsyncSession,
    name: str,
    with_special_folders: bool = False,
    exists_ok: bool = False
) -> schema.Group:
    if exists_ok:
        stmt = select(orm.Group).where(orm.Group.name == name)
        result = (await db_session.execute(stmt)).scalars().all()
        if len(result) >= 1:
            logger.info(f"Group {name} already exists")
            return schema.Group.model_validate(result[0])

    group_id = uuid.uuid4()

    if with_special_folders:
        await db_session.execute(text("SET CONSTRAINTS ALL DEFERRED"))

        home_id = uuid.uuid4()
        inbox_id = uuid.uuid4()
        db_inbox = orm.Folder(
            id=inbox_id,
            title=constants.INBOX_TITLE,
            ctype=constants.CTYPE_FOLDER,
            group_id=group_id,  # owned by group
            lang="xxx",  # not used
        )
        db_home = orm.Folder(
            id=home_id,
            title=constants.HOME_TITLE,
            ctype=constants.CTYPE_FOLDER,
            group_id=group_id,  # owned by group
            lang="xxx",  # not used
        )
        group = orm.Group(
            id=group_id,
            name=name,
            home_folder_id=home_id,
            inbox_folder_id=inbox_id
        )

        db_session.add_all([db_home, db_inbox, group])
    else:
        group = orm.Group(id=group_id, name=name)
        db_session.add(group)

    await db_session.commit()

    result = schema.Group.model_validate(group)

    return result


async def update_group(
    db_session: AsyncSession, group_id: uuid.UUID, attrs: schema.UpdateGroup
) -> schema.Group:
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group: schema.Group = (
        (await db_session.execute(stmt, params={"id": group_id})).scalars().one()
    )
    group.name = attrs.name
    if attrs.with_special_folders:
        group.delete_special_folders = False
        if group.home_folder_id and group.inbox_folder_id:
            # nothing to do as both home and inbox are already there
            pass
        else:
            # set home/inbox UUID
            home_id = uuid.uuid4()
            inbox_id = uuid.uuid4()
            db_inbox = orm.Folder(
                id=inbox_id,
                title=constants.INBOX_TITLE,
                ctype=constants.CTYPE_FOLDER,
                group_id=group_id,  # owned by group
                lang="xxx",  # not used
            )
            db_home = orm.Folder(
                id=home_id,
                title=constants.HOME_TITLE,
                ctype=constants.CTYPE_FOLDER,
                group_id=group.id,  # owned by group
                lang="xxx",  # not used
            )
            db_session.add(db_home)
            db_session.add(db_inbox)
            await db_session.commit()
            group.home_folder_id = home_id
            group.inbox_folder_id = inbox_id
            db_session.add(group)
            await db_session.commit()
    else:
        group.delete_special_folders = True

    await db_session.commit()

    result = schema.Group(id=group.id, name=group.name)

    return result


async def delete_group(
    db_session: AsyncSession,
    group_id: uuid.UUID,
):
    stmt = select(orm.Group).where(orm.Group.id == group_id)
    group = (await db_session.execute(stmt, params={"id": group_id})).scalars().one()
    await db_session.delete(group)
    await db_session.commit()
