from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.tags.db.orm import Tag, NodeTagsAssociation


async def test_basic_node_tag_association_test(
    db_session: AsyncSession,
    user,
    make_folder,
    make_tag
):
    tag = await make_tag(
        name="important",
        user=user
    )
    folder = await make_folder(
        title="My Documents",
        parent=user.home_folder,
        user=user)

    db_session.add(tag)
    db_session.add(folder)
    folder.tags.append(tag)

    await db_session.commit()

    stmt = (
        select(func.count(Tag.id))
        .select_from(Tag)
        .join(NodeTagsAssociation)
        .where(NodeTagsAssociation.node_id == folder.id)
    )

    assert (await db_session.execute(stmt)).scalar() == 1


async def test_add_three_tags_to_folder(
    db_session: AsyncSession,
    user,
    make_folder,
    make_tag
):
    tag1 = await make_tag(name="important1", user=user)
    tag2 = await make_tag(name="important2", user=user)
    tag3 = await make_tag(name="important3", user=user)
    folder = await make_folder(
        title="My Documents",
        parent=user.home_folder,
        user=user
    )

    db_session.add_all([tag1, tag2, tag3, folder])
    folder.tags.extend([tag1, tag2, tag3])

    await db_session.commit()

    stmt = (
        select(func.count(Tag.id))
        .select_from(Tag)
        .join(NodeTagsAssociation)
        .where(NodeTagsAssociation.node_id == folder.id)
    )

    assert (await db_session.execute(stmt)).scalar() == 3
