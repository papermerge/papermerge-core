import uuid

import pytest
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm, schema
from papermerge.core.features.nodes.db import api as dbapi
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.features.custom_fields.db import api as cf_dbapi
from papermerge.core.db import common as common_dbapi
from papermerge.core.types import ResourceType, OwnerType


async def test_get_descendants(make_folder, make_document, db_session: AsyncSession, user):

    mydocs_folder = await make_folder(
        title="My Documents", parent=user.home_folder, user=user
    )
    invoice = await make_document(
        title="invoice.pdf",
        user=user,
        parent=mydocs_folder,
    )
    nested_folder = await make_folder(title="Nested Folder", parent=mydocs_folder, user=user)

    doc1 = await make_document(
        title="doc1.pdf",
        user=user,
        parent=nested_folder,
    )

    doc2 = await make_document(
        title="doc2.pdf",
        user=user,
        parent=nested_folder,
    )

    actual_descendants = {
        item[0]
        for item in await dbapi.get_descendants(db_session, node_ids=[mydocs_folder.id])
    }  # ids

    expected_descendants = {
        invoice.id,
        mydocs_folder.id,
        doc1.id,
        doc2.id,
        nested_folder.id,
    }  # ids

    assert expected_descendants == actual_descendants


async def test_get_descendants_include_self(make_folder, make_document, db_session: AsyncSession, user):

    mydocs_folder = await make_folder(
        title="My Documents", parent=user.home_folder, user=user
    )
    invoice = await make_document(
        title="invoice.pdf",
        user=user,
        parent=mydocs_folder,
    )

    found_ids = {
        item[0]
        for item in await dbapi.get_descendants(db_session, node_ids=[mydocs_folder.id])
    }

    assert invoice.id in found_ids
    assert mydocs_folder.id in found_ids
    assert len(found_ids) == 2


async def test_get_descendants_without_self(make_folder, make_document, db_session: AsyncSession, user):

    mydocs_folder = await make_folder(
        title="My Documents", parent=user.home_folder, user=user
    )
    invoice = await make_document(
        title="invoice.pdf",
        user=user,
        parent=mydocs_folder,
    )

    found_ids = {
        item[0]
        for item in await dbapi.get_descendants(
            db_session, node_ids=[mydocs_folder.id], include_selfs=False
        )
    }

    # result SHOULD NOT include "My documents" folder
    assert invoice.id in found_ids
    assert len(found_ids) == 1


async def test_get_descendants_garbage_input(db_session: AsyncSession):
    with pytest.raises(ValueError):
        await dbapi.get_descendants(db_session, "bla")

    with pytest.raises(ValueError):
        await dbapi.get_descendants(db_session, uuid.uuid4())

    with pytest.raises(ValueError):
        await dbapi.get_descendants(db_session, [])


async def test_delete_document_which_has_custom_fields(
    db_session: AsyncSession, make_document_receipt, user
):
    """User should be able to delete documents which have associated
    custom fields values

    Also document deletion must "take away" also its custom fields i.e.
    document custom fields must be deleted as well
    """

    # Arrange
    receipt = await make_document_receipt(title="receipt-1.pdf", user=user)
    doc_count_before = (await db_session.execute(
        select(func.count(orm.Document.id)).where(orm.Document.title == "receipt-1.pdf")
    )).scalar()

    assert doc_count_before == 1

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt.id,
        custom_fields=cf,
    )

    # Act
    error = await dbapi.delete_nodes(db_session, node_ids=[receipt.id], user_id=user.id)

    # Assert
    assert error is None, error.model_dump()
    doc_count_after = (await db_session.execute(
        select(func.count(orm.Document.id)).where(orm.Document.title == "receipt-1.pdf")
    )).scalar()
    cfv_count = (await db_session.execute(select(func.count(orm.CustomFieldValue.id)))).scalar()

    # document was deleted
    assert doc_count_after == 0
    # its custom fields must be deleted as well
    assert cfv_count == 0


async def test_delete_recursively_documents_which_has_custom_fields(
    db_session: AsyncSession, make_document_receipt, make_folder, user
):
    """User should be able to delete documents which have associated
    custom fields values. In this scenario documents to be
    deleted are placed inside a folder "My Documents". User
    deletes folder "My Documents". The effect is
    expected to be deletion of all documents inside that folder
    altogether with their associated custom field values.
    """

    # Arrange
    my_folder = await make_folder(title="My Documents", parent=user.home_folder, user=user)
    receipt1 = await make_document_receipt(title="receipt-1.pdf", user=user, parent=my_folder)
    receipt2 = await make_document_receipt(title="receipt-2.pdf", user=user, parent=my_folder)

    # set initial CFVs
    cf = {"EffectiveDate": "2024-09-26", "Shop": "Aldi", "Total": "32.97"}

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt1.id,
        custom_fields=cf,
    )

    await cf_dbapi.update_document_custom_field_values(
        db_session,
        document_id=receipt2.id,
        custom_fields=cf,
    )

    doc_count_before = (await db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["receipt-1.pdf", "receipt-2.pdf"])
        )
    )).scalar()

    assert doc_count_before == 2
    cfv_count_before = (await db_session.execute(
        select(func.count(orm.CustomFieldValue.id))
    )).scalar()

    assert cfv_count_before == 6

    # Act
    error = await dbapi.delete_nodes(db_session, node_ids=[my_folder.id], user_id=user.id)

    # Assert
    assert error is None, error.model_dump()
    doc_count_after = (await db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["receipt-1.pdf", "receipt-2.pdf"])
        )
    )).scalar()
    cfv_count = (await db_session.execute(select(func.count(orm.CustomFieldValue.id)))).scalar()

    # document was deleted
    assert doc_count_after == 0
    # its custom fields must be deleted as well
    assert cfv_count == 0

async def test_delete_folder_recursively_with_its_content(
    db_session: AsyncSession, make_document, make_folder, user
):
    """
    User must be able to delete folder with its content.
    If user deletes a folder - all folder descendants (other folders and documents)
    must be deleted as well.
    """
    # Arrange
    my_folder = await make_folder(title="My Documents", parent=user.home_folder, user=user)
    await make_document(title="doc-1.pdf", user=user, parent=my_folder)
    await make_document(title="doc-2.pdf", user=user, parent=my_folder)

    doc_count_before = (await db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["doc-1.pdf", "doc-2.pdf"])
        )
    )).scalar()

    assert doc_count_before == 2

    # Act
    error = await dbapi.delete_nodes(db_session, node_ids=[my_folder.id], user_id=user.id)

    # Assert
    assert error is None, error.model_dump()

    doc_count_after = (await db_session.execute(
        select(func.count(orm.Document.id)).where(
            orm.Document.title.in_(["doc-1.pdf", "doc-2.pdf"])
        )
    )).scalar()

    assert doc_count_after == 0


async def test_get_node_tags_node_is_a_document(db_session: AsyncSession, make_document, user):
    """test for `get_node_tags`"""
    # arrange
    doc = await make_document(title="some.pdf", user=user, parent=user.home_folder)

    await dbapi.assign_node_tags(
        db_session,
        node_id=doc.id,
        tags=["tag1", "tag2"],
        created_by=user.id
    )
    # act
    tags, error = await dbapi.get_node_tags(db_session, node_id=doc.id, user_id=user.id)

    # assert
    assert error is None
    assert {"tag1", "tag2"} == {t.name for t in tags}


async def test_get_node_tags_node_is_a_folder(db_session: AsyncSession, make_folder, user):
    """test for `get_node_tags`"""
    # arrange
    folder = await make_folder(title="My Folder", user=user, parent=user.home_folder)

    await dbapi.assign_node_tags(
        db_session,
        node_id=folder.id,
        tags=["tag1", "tag2"],
        created_by=user.id
    )
    # act
    tags, error = await dbapi.get_node_tags(db_session, node_id=folder.id, user_id=user.id)

    # assert
    assert error is None
    assert {"tag1", "tag2"} == {t.name for t in tags}


async def test_prepare_documents_s3_data_deletion_one_doc(
    db_session: AsyncSession, make_document_with_pages, user
):
    # Arrange
    doc1: schema.Document = await make_document_with_pages(
        title="doc1.pdf", user=user, parent=user.home_folder
    )
    await make_document_with_pages(title="doc2.pdf", user=user, parent=user.home_folder)

    # Act
    data = await dbapi.prepare_documents_s3_data_deletion(db_session, [doc1.id])

    # Assert
    doc1_ver_id = doc1.versions[0].id
    doc1_page_ids = (await db_session.execute(
        select(orm.Page.id).where(orm.Page.document_version_id == doc1_ver_id)
    )).scalars()

    assert data.document_ids == [doc1.id]
    assert data.document_version_ids == [doc1_ver_id]
    assert set(data.page_ids) == set(doc1_page_ids)


async def test_prepare_documents_s3_data_deletion_multiple_docs(
    db_session: AsyncSession, make_document_with_pages, user, make_folder
):
    # Arrange
    folder = await make_folder(title="My Docs", user=user, parent=user.home_folder)
    doc1: schema.Document = await make_document_with_pages(
        title="doc1.pdf", user=user, parent=folder
    )
    doc2: schema.Document = await make_document_with_pages(
        title="doc2.pdf", user=user, parent=folder
    )

    # Act
    data = await dbapi.prepare_documents_s3_data_deletion(
        db_session, [folder.id, doc1.id, doc2.id]
    )

    # Assert
    doc1_ver_id = doc1.versions[0].id
    doc1_page_ids = (await db_session.execute(
        select(orm.Page.id).where(orm.Page.document_version_id == doc1_ver_id)
    )).scalars()

    doc2_ver_id = doc2.versions[0].id
    doc2_page_ids = (await db_session.execute(
        select(orm.Page.id).where(orm.Page.document_version_id == doc2_ver_id)
    )).scalars()

    assert set(data.document_ids) == {doc1.id, doc2.id}
    assert set(data.document_version_ids) == {doc1_ver_id, doc2_ver_id}
    assert set(data.page_ids) == set().union(doc1_page_ids, doc2_page_ids)


async def test_move_nodes(
    db_session: AsyncSession,
    make_folder,
    make_document,
    make_group,
    user,
):
    """
    Moving nodes to a target which belongs to a group ("family" in this case)
    should change their (and their descendants) owner: they will
    belong to the group ("family").
    """
    source_folder = await make_folder(
        title="My Documents", parent=user.home_folder, user=user
    )
    await make_document(title="doc-1.pdf", user=user, parent=source_folder)
    await make_document(title="doc-2.pdf", user=user, parent=source_folder)
    family = await make_group("Family", with_special_folders=True)
    target_folder = await make_folder(
        title="My Family", parent=family.home_folder, group=family
    )

    await dbapi.move_nodes(
        db_session, source_ids=[source_folder.id], target_id=target_folder.id
    )
    descendants = await common_dbapi.get_descendants(
        db_session, node_ids=[target_folder.id], include_selfs=False
    )
    descendants_ids = [item[0] for item in descendants]

    assert len(descendants_ids) == 3
    for descendant_id in descendants_ids:
        owner_type, owner_id = await ownership_api.get_owner_info(
            db_session,
            resource_type=ResourceType.NODE,
            resource_id=descendant_id
        )
        assert owner_id == family.id
        assert owner_type == OwnerType.GROUP
