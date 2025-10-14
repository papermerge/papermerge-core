from sqlalchemy.ext.asyncio import AsyncSession

from core.types import OwnerType
from papermerge.core import orm, schema
from papermerge.core.features.document_types.db import api as dt_dbapi


async def test_get_document_types_by_owner_without_pagination(
    db_session: AsyncSession, make_document_type, user, make_group
):
    family: orm.Group = await make_group("Family")
    await make_document_type(name="Family Shopping", group_id=family.id)
    await make_document_type(name="Bills", group_id=family.id)
    await make_document_type(name="My Private", user=user)

    user_group = orm.UserGroup(user_id=user.id, group_id=family.id)
    db_session.add(user_group)
    await db_session.commit()

    owner = schema.Owner(owner_type=OwnerType.GROUP, owner_id=family.id)

    results = await dt_dbapi.get_document_types_by_owner_without_pagination(
        db_session, owner=owner
    )

    assert len(results) == 2


async def test_document_type_cf_count(db_session: AsyncSession, make_document_zdf, user):
    zdf_doc_instance: orm.Document = await make_document_zdf(title="ZDF Title", user=user)

    cf_count = await dt_dbapi.document_type_cf_count(
        db_session, document_type_id=zdf_doc_instance.document_type_id
    )

    assert cf_count == 3
