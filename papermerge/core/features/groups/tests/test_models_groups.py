from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import dbapi


async def test_group_create(db_session: AsyncSession):
    group = await dbapi.create_group(db_session, "G1")
    group_details = await dbapi.get_group(db_session, group_id=group.id)

    assert group_details.name == "G1"

    await dbapi.delete_group(db_session, group.id)


async def test_create_group_with_special_folders(db_session: AsyncSession):
    group = await dbapi.create_group(
        db_session,
        "G1wSP",
        with_special_folders=True
    )
    group_details = await dbapi.get_group(db_session, group_id=group.id)

    assert group_details.name == "G1wSP"
    assert group_details.home_folder_id is not None
    assert group_details.inbox_folder_id is not None

    await dbapi.delete_group(db_session, group.id)
