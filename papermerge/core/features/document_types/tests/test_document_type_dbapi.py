from sqlalchemy.ext.asyncio import AsyncSession

from core.types import OwnerType
from papermerge.core import orm, schema
from papermerge.core.features.document_types.db import api as dt_dbapi
from papermerge.core.features.users.db import api as users_api
from papermerge.core.features.users import schema as users_schema


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


async def test_get_document_types_grouped_by_owner_without_pagination(
    db_session: AsyncSession,
    make_document_type,
    make_group,
    make_user,
):
    user: orm.User = await make_user(username="coco")
    group: orm.Group = await make_group("team one")
    await make_document_type(name="My Private", user=user)
    await make_document_type(name="Anual reports", group_id=group.id)
    await make_document_type(name="q2 reports", group_id=group.id)

    update_attrs = users_schema.UpdateUser(group_ids=[group.id])
    await users_api.update_user(db_session, user_id=user.id, attrs=update_attrs)

    result = await dt_dbapi.get_document_types_grouped_by_owner_without_pagination(
        db_session,
        user_id=user.id
    )

    assert len(result) == 2
    group_names = [item.name for item in result]
    assert set(group_names) == {"My", "team one"}


async def test_get_document_types_list(
    db_session,
    make_user,
    make_document_type_with_custom_fields
):
    user: orm.User = await make_user(username="coco")
    doc_type = await make_document_type_with_custom_fields(
        name="Invoice",
        custom_fields=[
            {"name": "Implemented", "type_handler": "boolean"},
        ],
        user_id=user.id
    )

    result = await dt_dbapi.get_document_type(
        db_session,
        user_id=user.id,
        document_type_id=doc_type.id
    )

    assert result.id == doc_type.id
