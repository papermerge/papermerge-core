from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, dbapi


async def test_get_document_types_grouped_by_owner_without_pagination(
    db_session: AsyncSession, make_document_type, user, make_group
):
    family: orm.Group = await make_group("Family")
    await make_document_type(name="Family Shopping", group_id=family.id)
    await make_document_type(name="Bills", group_id=family.id)
    await make_document_type(name="My Private", user=user)

    user.groups.append(family)
    db_session.add(user)
    await db_session.commit()

    results = await dbapi.get_document_types_grouped_by_owner_without_pagination(
        db_session, user_id=user.id
    )

    assert len(results) == 2
