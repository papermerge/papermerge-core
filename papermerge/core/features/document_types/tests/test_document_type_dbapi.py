import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.features.document_types import schema as dt_schema
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import NodeResource
from papermerge.core.types import OwnerType, Owner
from papermerge.core import orm
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

    owner = Owner(owner_type=OwnerType.GROUP, owner_id=family.id)

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


async def test_custom_fields_returned_in_defined_order(
    db_session,
    user,
    make_custom_field_v2,
):
    """
    Test that custom field values are returned in the order
    defined when creating the document type.

    Steps:
    1. Create 5 custom fields (cf1, cf2, cf3, cf4, cf5)
    2. Create a document type with fields in specific order: cf3, cf1, cf5, cf2, cf4
    3. Create two documents with that document type
    4. Set some values for the custom fields
    5. Verify get_document_custom_field_values returns fields in the defined order
    """
    # Step 1: Create 5 custom fields
    cf1 = await make_custom_field_v2(name="cf1", type_handler="number")
    cf2 = await make_custom_field_v2(name="cf2", type_handler="number")
    cf3 = await make_custom_field_v2(name="cf3", type_handler="number")
    cf4 = await make_custom_field_v2(name="cf4", type_handler="number")
    cf5 = await make_custom_field_v2(name="cf5", type_handler="number")

    # Step 2: Create document type with fields in NON-alphabetical order
    # This order should be preserved: cf3, cf1, cf5, cf2, cf4
    custom_field_ids = [cf3.id, cf1.id, cf5.id, cf2.id, cf4.id]
    expected_order = ["cf3", "cf1", "cf5", "cf2", "cf4"]

    create_dt_data = dt_schema.CreateDocumentType(
        name="Category 1",
        custom_field_ids=custom_field_ids,
        owner_type=OwnerType.USER,
        owner_id=user.id
    )
    document_type = await dt_dbapi.create_document_type(
        db_session,
        data=create_dt_data
    )

    # Step 3: Create two documents with that document type
    doc1 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="Document-1.pdf",
        document_type_id=document_type.id,
        parent_id=user.home_folder_id,
    )
    doc2 = orm.Document(
        id=uuid.uuid4(),
        ctype="document",
        title="Document-2.pdf",
        document_type_id=document_type.id,
        parent_id=user.home_folder_id,
    )
    db_session.add(doc1)
    db_session.add(doc2)
    await db_session.flush()

    # Set ownership for documents
    await ownership_api.set_owner(
        session=db_session,
        resource=NodeResource(id=doc1.id),
        owner=Owner(owner_type=OwnerType.USER, owner_id=user.id)
    )
    await ownership_api.set_owner(
        session=db_session,
        resource=NodeResource(id=doc2.id),
        owner=Owner(owner_type=OwnerType.USER, owner_id=user.id)
    )
    await db_session.commit()

    # Step 4: Set some values for the custom fields
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc1.id,
        custom_fields={"cf1": 100, "cf2": 200, "cf3": 300, "cf4": 400, "cf5": 500}
    )
    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=doc2.id,
        custom_fields={"cf1": 10, "cf3": 30, "cf5": 50}  # Only some fields
    )

    # Step 5: Verify get_document_custom_field_values returns fields in defined order
    doc1_fields = await cf_dbapi.get_document_custom_field_values(
        db_session,
        document_id=doc1.id
    )
    doc2_fields = await cf_dbapi.get_document_custom_field_values(
        db_session,
        document_id=doc2.id
    )

    # Check that field names are in the expected order
    doc1_field_names = [item.custom_field.name for item in doc1_fields]
    doc2_field_names = [item.custom_field.name for item in doc2_fields]

    assert doc1_field_names == expected_order, (
        f"Doc1 fields not in expected order. "
        f"Expected: {expected_order}, Got: {doc1_field_names}"
    )
    assert doc2_field_names == expected_order, (
        f"Doc2 fields not in expected order. "
        f"Expected: {expected_order}, Got: {doc2_field_names}"
    )

    # Also verify the values are correct for doc1
    doc1_values = {
        item.custom_field.name: item.value.value.raw if item.value else None
        for item in doc1_fields
    }
    assert doc1_values["cf1"] == 100
    assert doc1_values["cf2"] == 200
    assert doc1_values["cf3"] == 300
    assert doc1_values["cf4"] == 400
    assert doc1_values["cf5"] == 500

    # Verify values for doc2 (some fields have no value)
    doc2_values = {
        item.custom_field.name: item.value.value.raw if item.value else None
        for item in doc2_fields
    }
    assert doc2_values["cf1"] == 10
    assert doc2_values["cf2"] is None  # Not set
    assert doc2_values["cf3"] == 30
    assert doc2_values["cf4"] is None  # Not set
    assert doc2_values["cf5"] == 50
