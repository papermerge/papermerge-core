from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.tags.db.orm import Tag, NodeTagsAssociation
from papermerge.core.features.nodes.db.orm import Folder


async def test_basic_node_tag_association_test(db_session: AsyncSession, my_documents_folder: Folder):
    tag = Tag(name="important", user_id=my_documents_folder.user.id)

    db_session.add(tag)
    db_session.add(my_documents_folder)
    my_documents_folder.tags.append(tag)
    await db_session.commit()

    stmt = (
        select(func.count(Tag.id))
        .select_from(Tag)
        .join(NodeTagsAssociation)
        .where(NodeTagsAssociation.node_id == my_documents_folder.id)
    )

    assert (await db_session.execute(stmt)).scalar() == 1


async def test_add_three_tags_to_folder(db_session: AsyncSession, my_documents_folder: Folder):
    tag1 = Tag(name="important1", user_id=my_documents_folder.user.id)
    tag2 = Tag(name="important2", user_id=my_documents_folder.user.id)
    tag3 = Tag(name="important3", user_id=my_documents_folder.user.id)

    db_session.add_all([tag1, tag2, tag3])
    db_session.add(my_documents_folder)
    my_documents_folder.tags.extend([tag1, tag2, tag3])
    await db_session.commit()

    stmt = (
        select(func.count(Tag.id))
        .select_from(Tag)
        .join(NodeTagsAssociation)
        .where(NodeTagsAssociation.node_id == my_documents_folder.id)
    )

    assert (await db_session.execute(stmt)).scalar() == 3
