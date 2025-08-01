from sqlalchemy.ext.asyncio import AsyncSession
from papermerge.core import dbapi


async def test_group_create(db_session: AsyncSession):
    group = await dbapi.create_group(db_session, "G1")
    group_details = await dbapi.get_group(db_session, group_id=group.id)

    assert group_details.name == "G1"

    await dbapi.delete_group(db_session, group.id)
