import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import OwnerType, TagResource, Owner


@pytest.fixture()
def make_tag(db_session: AsyncSession, system_user):
    async def _maker(
        name: str,
        user: orm.User | None = None,
        bg_color: str = "red",
        fg_color: str = "white",
        group_id: uuid.UUID | None = None,
    ):
        if group_id:
            owner_type = OwnerType.GROUP
            owner_id = group_id
        elif user:
            owner_type = OwnerType.USER
            owner_id = user.id
        else:
            raise ValueError("Either user or group_id must be provided")

        db_tag = orm.Tag(
            name=name,
            bg_color=bg_color,
            fg_color=fg_color,
            created_by=system_user.id,
            updated_by=system_user.id,
        )
        db_session.add(db_tag)
        await db_session.flush()

        await ownership_api.set_owner(
            session=db_session,
            resource=TagResource(id=db_tag.id),
            owner=Owner(owner_type=owner_type, owner_id=owner_id)
        )

        await db_session.commit()
        await db_session.refresh(db_tag)

        return db_tag

    return _maker
