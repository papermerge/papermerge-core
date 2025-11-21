import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.nodes.db import api as nodes_dbapi
from papermerge.core import orm, schema
from papermerge.core.tests.types import AuthTestClient


async def test_get_node_details(auth_api_client: AuthTestClient, make_document):
    # Arrange
    user = auth_api_client.user
    doc = await make_document(title="letter.pdf", user=user, parent=user.home_folder)

    # Act
    response = await auth_api_client.get(f"/nodes/?node_ids={doc.id}")

    # Assert
    assert response.status_code == 200


async def test_nodes_move_basic(
    auth_api_client: AuthTestClient, make_folder, make_document, db_session: AsyncSession
):
    """
    Given document "letter.pdf", located in user's home folder, and target
    folder "Target Folder", the move endpoint must move document "letter.pdf"
    from user's home folder into the "Target Folder".
    """
    user = auth_api_client.user
    target = await make_folder(title="Target Folder", user=user, parent=user.home_folder)
    doc = await make_document(title="letter.pdf", user=user, parent=user.home_folder)

    params = {"source_ids": [str(doc.id)], "target_id": str(target.id)}

    response = await auth_api_client.post("/nodes/move", json=params)

    assert response.status_code == 200, response.json()

    stmt = select(orm.Document.parent_id).where(orm.Document.title == "letter.pdf")
    new_parent_id = (await db_session.execute(stmt)).scalar()
    assert new_parent_id == target.id


async def test_nodes_move_when_target_id_does_not_exist(
    auth_api_client: AuthTestClient, make_folder, make_document, db_session: AsyncSession
):
    """Test move_endpoint when target ID is UUID of non-existing node"""
    user = auth_api_client.user
    doc = await make_document(title="letter.pdf", user=user, parent=user.home_folder)

    params = {"source_ids": [str(doc.id)], "target_id": str(uuid.uuid4())}

    response = await auth_api_client.post("/nodes/move", json=params)

    assert response.status_code == 403, response.json()

    stmt = select(orm.Document.parent_id).where(orm.Document.title == "letter.pdf")
    # doc.parent id should not change i.e. "letter.pdf" is still in home folder
    current_parent_id = (await db_session.execute(stmt)).scalar()
    assert current_parent_id == user.home_folder.id


async def test_nodes_move_when_source_id_does_not_exist(
    auth_api_client: AuthTestClient, db_session: AsyncSession, make_folder
):
    """Test move_endpoint when source ID is UUID of non-existing node"""
    user = auth_api_client.user
    target = await make_folder(title="Target Folder", user=user, parent=user.home_folder)

    params = {"source_ids": [str(uuid.uuid4())], "target_id": str(target.id)}

    response = await auth_api_client.post("/nodes/move", json=params)

    assert response.status_code == 403, response.json()


async def test_nodes_move_when_some_source_id_does_not_exist(
    auth_api_client: AuthTestClient, make_folder, make_document
):
    """Test move_endpoint when some source ID don't exist"""
    user = auth_api_client.user
    doc1 = await make_document(title="doc1", user=user, parent=user.home_folder)
    doc2 = await make_document(title="doc2", user=user, parent=user.home_folder)
    target = await make_folder(title="Target Folder", user=user, parent=user.home_folder)

    source_ids = [str(uuid.uuid4()), str(doc1.id), str(doc2.id)]
    params = {
        "source_ids": source_ids,  # note that source_ids[0] does not exit
        "target_id": str(target.id),
    }

    response = await auth_api_client.post("/nodes/move", json=params)

    assert response.status_code == 403, response.json()


async def test_create_document_with_custom_id(auth_api_client: AuthTestClient, db_session: AsyncSession):
    """
    Allow custom ID attribute: if ID attribute is set, then node will set it
    as its ID.
    """
    assert await doc_dbapi.count_docs(db_session) == 0

    user = auth_api_client.user

    custom_id = uuid.uuid4()

    payload = dict(
        id=str(custom_id),
        ctype="document",
        # "lang" attribute is not set
        title="doc1.pdf",
        parent_id=str(user.home_folder.id),
    )

    response = await auth_api_client.post("/nodes/", json=payload)
    assert response.status_code == 201, response.json()
    assert await doc_dbapi.count_docs(db_session) == 1
    doc = (await db_session.scalars(select(orm.Document).limit(1))).one()
    assert doc.id == custom_id


async def test_create_folder_with_custom_id(auth_api_client: AuthTestClient, db_session: AsyncSession):
    """
    Allow custom ID attribute: if ID attribute is set, then node will set it
    as its ID.
    """
    user = auth_api_client.user

    custom_id = uuid.uuid4()

    payload = dict(
        id=str(custom_id),
        ctype="folder",
        title="My Documents",
        parent_id=str(user.home_folder.id),
    )

    response = await auth_api_client.post("/nodes/", json=payload)
    folder =(await db_session.scalars(
        select(orm.Folder).where(orm.Node.title == "My Documents")
    )).one()

    assert response.status_code == 201, response.json()
    assert folder.id == custom_id


async def test_create_document(auth_api_client: AuthTestClient, db_session: AsyncSession):
    """
    When 'lang' attribute is not specified during document creation
    it is set from user preferences['ocr_language']
    """
    assert await doc_dbapi.count_docs(db_session) == 0

    user = auth_api_client.user

    payload = {
        "ctype": "document",
        # "lang" attribute is not set
        "title": "doc1.pdf",
        "parent_id": str(user.home_folder.id),
    }

    response = await auth_api_client.post("/nodes/", json=payload)

    assert response.status_code == 201, response.json()
    assert await doc_dbapi.count_docs(db_session) == 1


async def test_two_folders_with_same_title_under_same_parent(auth_api_client: AuthTestClient):
    """It should not be possible to create two folders with
    same (parent, title) pair i.e. we cannot have folders with same
    title under same parent
    """
    user = auth_api_client.user
    payload = {
        "ctype": "folder",
        "title": "My Documents",
        "parent_id": str(user.home_folder.id),
    }

    # Create first folder 'My documents' (inside home folder)
    response = await auth_api_client.post("/nodes/", json=payload)
    assert response.status_code == 201, response.json()

    # Create second folder 'My Documents' also inside home folder
    response = await auth_api_client.post("/nodes/", json=payload)
    assert response.status_code == 400, response.json()


async def test_two_folders_with_same_title_under_different_parents(
    auth_api_client: AuthTestClient,
):
    """It should be possible to create two folders with
    same title if they are under different parents.
    """
    user = auth_api_client.user
    payload = {
        "ctype": "folder",
        "title": "My Documents",
        "parent_id": str(user.home_folder.id),
    }

    # Create first folder 'My documents' (inside home folder)
    response = await auth_api_client.post("/nodes/", json=payload)
    assert response.status_code == 201, response.json()

    # Create second folder 'My Documents' also inside home folder
    payload2 = {
        "ctype": "folder",
        "title": "My Documents",
        "parent_id": str(user.inbox_folder.id),
    }
    # create folder 'My Documents' in Inbox
    response = await auth_api_client.post("/nodes/", json=payload2)
    assert response.status_code == 201, response.json()


async def test_two_documents_with_same_title_under_same_parent(
    auth_api_client: AuthTestClient,
):
    """It should be possible to create two documents with
    same (parent, title) pair i.e. we cannot have documents with same
    title under same parent
    """
    user = auth_api_client.user
    payload = {
        "ctype": "document",
        "title": "My Documents",
        "parent_id": str(user.home_folder.id),
    }

    # Create first folder 'My documents' (inside home folder)
    response = await auth_api_client.post("/nodes/", json=payload)

    assert response.status_code == 201

    # Create second folder 'My Documents' also inside home folder
    response = await auth_api_client.post("/nodes/", json=payload)

    assert response.status_code == 201


async def test_assign_tags_to_non_tagged_folder(
    auth_api_client: AuthTestClient, make_folder, db_session: AsyncSession
):
    """
    url:
        POST /api/nodes/{node_id}/tags
    body content:
        ["paid", "important"]

    where N1 is a folder without any tag

    Expected result:
        folder N1 will have two tags assigned: 'paid' and 'important'
    """
    receipts = await make_folder(
        title="Receipts",
        user=auth_api_client.user,
        parent=auth_api_client.user.inbox_folder,
    )
    payload = ["paid", "important"]

    response = await auth_api_client.post(f"/nodes/{receipts.id}/tags", json=payload)

    assert response.status_code == 200, response.json()

    folder = (await db_session.scalars(
        select(orm.Folder).where(
            orm.Folder.id == receipts.id,
        )
    )).one()

    stmt = (
        select(func.count(orm.Tag.id))
        .select_from(orm.Tag)
        .join(orm.NodeTagsAssociation)
        .where(orm.NodeTagsAssociation.node_id == folder.id)
    )

    assert (await db_session.execute(stmt)).scalar() == 2


async def test_assign_tags_to_tagged_folder(
    auth_api_client: AuthTestClient, make_folder, db_session: AsyncSession
):
    """
    url:
        POST /api/nodes/{N1}/tags/
    body content:
        ["paid", "important"]

    where N1 is a folder with two tags 'important' and 'unpaid' already
    assigned

    Expected result:
        folder N1 will have two tags assigned: 'paid' and 'important'.
        Tag 'unpaid' will be dissociated from the folder.
    """
    u = auth_api_client.user
    receipts = await make_folder(title="Receipts", user=u, parent=u.inbox_folder)

    await nodes_dbapi.assign_node_tags(
        db_session, node_id=receipts.id, tags=["important", "unpaid"]
    )
    payload = ["paid", "important"]
    response = await auth_api_client.post(
        f"/nodes/{receipts.id}/tags",
        json=payload,
    )
    assert response.status_code == 200, response.json()

    folder = (await db_session.scalars(
        select(orm.Folder).where(
            orm.Folder.id == receipts.id
        )
    )).one()

    assert len(folder.tags) == 2

    all_new_tags = [tag.name for tag in folder.tags]
    # tag 'unpaid' is not attached to folder anymore

    assert set(all_new_tags) == {"paid", "important"}
    # model for tag 'unpaid' still exists, it was just
    # dissociated from folder 'Receipts'
    stmt = select(orm.Tag).where(orm.Tag.name == "unpaid")
    unpaid_tag = (await db_session.execute(stmt)).one_or_none()
    assert unpaid_tag is not None


async def test_assign_tags_to_document(
    auth_api_client: AuthTestClient, make_document, db_session: AsyncSession
):
    """
    url:
        POST /api/nodes/{D1}/tags/
    body content:
        ["xyz"]

    where D1 is a document

    Expected result:
        document D1 will have one tag assigned 'xyz'
    """
    u = auth_api_client.user
    d1 = await make_document(title="invoice.pdf", user=u, parent=u.home_folder)

    await nodes_dbapi.assign_node_tags(
        db_session, node_id=d1.id, tags=["important", "unpaid"]
    )

    payload = ["xyz"]

    response = await auth_api_client.post(
        f"/nodes/{d1.id}/tags",
        json=payload,
    )

    assert response.status_code == 200

    found_d1 = (await db_session.scalars(
        select(orm.Document).where(
            orm.Document.id == d1.id
        )
    )).one()

    assert len(found_d1.tags) == 1

    all_new_tags = [tag.name for tag in found_d1.tags]

    assert set(all_new_tags) == {"xyz"}


async def test_append_tags_to_folder(
    auth_api_client: AuthTestClient, make_folder, db_session: AsyncSession
):
    """
    url:
        PATCH /api/nodes/{N1}/tags/
    body content:
        ["paid"]

    where N1 is a folder with already one tag attached: 'important'

    Expected result:
        folder N1 will have two tags assigned: 'paid' and 'important'
        Notice that 'paid' was appended next to 'important'.
    """
    u = auth_api_client.user
    receipts = await make_folder(title="Receipts", user=u, parent=u.inbox_folder)
    await nodes_dbapi.assign_node_tags(
        db_session, node_id=receipts.id, tags=["important"]
    )
    payload = ["paid"]
    response = await auth_api_client.patch(
        f"/nodes/{receipts.id}/tags",
        json=payload,
    )

    assert response.status_code == 200, response.json()
    folder = (await db_session.scalars(
        select(orm.Folder).where(
            orm.Folder.id == receipts.id
        )
    )).one()
    assert len(folder.tags) == 2
    all_new_tags = [tag.name for tag in receipts.tags]

    assert set(all_new_tags) == {"paid", "important"}


async def test_remove_tags_from_folder(
    auth_api_client: AuthTestClient, make_folder, db_session: AsyncSession
):
    """
    url:
        DELETE /api/nodes/{N1}/tags/
    body content:
        ["important"]

    where N1 is a folder with four tags 'important', 'paid', 'receipt',
    'bakery'

    Expected result:
        folder N1 will have three tags assigned: 'paid', 'bakery', 'receipt'
    """
    u = auth_api_client.user
    receipts = await make_folder(title="Receipts", user=u, parent=u.inbox_folder)
    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=receipts.id,
        tags=["important", "paid", "receipt", "bakery"],
    )
    payload = ["important"]
    response = await auth_api_client.delete(
        f"/nodes/{receipts.id}/tags",
        json=payload,
    )

    assert response.status_code == 200, response.json()

    folder = (await db_session.scalars(
        select(orm.Folder).where(
            orm.Folder.id == receipts.id,
        )
    )).one()

    await db_session.refresh(folder)
    assert len(folder.tags) == 3
    all_new_tags = [tag.name for tag in receipts.tags]
    assert set(all_new_tags) == {"paid", "bakery", "receipt"}


async def test_home_with_two_tagged_nodes(
    auth_api_client: AuthTestClient, make_folder, make_document, db_session: AsyncSession
):
    """
    Create two tagged nodes (one folder and one document) in user's home.
    Retrieve user's home content and check that tags
    were included in response as well.
    """
    u = auth_api_client.user
    folder = await make_folder(title="folder", user=u, parent=u.home_folder)
    doc = await make_document(title="doc.pdf", user=u, parent=u.home_folder)
    home = u.home_folder

    await nodes_dbapi.assign_node_tags(
        db_session, node_id=folder.id, tags=["folder_a", "folder_b"]
    )
    await nodes_dbapi.assign_node_tags(
        db_session, node_id=doc.id, tags=["doc_a", "doc_b"]
    )

    response = await auth_api_client.get(f"/nodes/{home.id}")
    assert response.status_code == 200

    results = response.json()["items"]
    assert len(results) == 2  # there are two folders

    doc_tag_names = [tag["name"] for tag in results[0]["tags"]]
    folder_tag_names = [tag["name"] for tag in results[1]["tags"]]

    assert {"doc_a", "doc_b"} == set(doc_tag_names)
    assert {"folder_a", "folder_b"} == set(folder_tag_names)


async def test_rename_folder(
    auth_api_client: AuthTestClient,
    make_folder,
    db_session: AsyncSession
):
    user = auth_api_client.user
    folder = await make_folder(title="Old Title", user=user, parent=user.home_folder)

    response = await auth_api_client.patch(f"/nodes/{folder.id}", json={"title": "New Title"})

    assert response.status_code == 200, response.content

    renamed_folder = await db_session.get(orm.Folder, folder.id)

    assert renamed_folder.title == "New Title"


async def test_get_folder_endpoint(auth_api_client: AuthTestClient):
    user = auth_api_client.user
    home = user.home_folder

    response = await auth_api_client.get(f"/folders/{home.id}")

    assert response.status_code == 200, response.json()


async def test_delete_nodes_one_folder(
    auth_api_client: AuthTestClient, make_folder, db_session: AsyncSession
):
    user = auth_api_client.user
    folder = await make_folder(title="My Documents", user=user, parent=user.home_folder)

    response = await auth_api_client.delete("/nodes/", json=[str(folder.id)])

    assert response.status_code == 200, response.json()

    stmt = select(orm.Folder).where(orm.Folder.id == folder.id)
    found = (await db_session.execute(stmt)).scalar()

    assert found is None


async def test_delete_nodes_multiple_nodes(
    auth_api_client: AuthTestClient, make_folder, make_document, db_session: AsyncSession
):
    user = auth_api_client.user
    folder = await make_folder(title="My Documents", user=user, parent=user.home_folder)
    doc = await make_document(title="letter.pdf", user=user, parent=user.home_folder)

    response = await auth_api_client.delete("/nodes/", json=[str(folder.id), str(doc.id)])

    assert response.status_code == 200, response.json()

    stmt = select(orm.Node).where(orm.Node.id.in_([folder.id, doc.id]))
    found = (await db_session.execute(stmt)).scalar()

    assert found is None


async def test_delete_nodes_with_descendants(
    auth_api_client: AuthTestClient, make_folder, make_document, db_session: AsyncSession
):
    """
    In this scenario there are a couple of nested folders with documents.
    When deleting top-most folder, its descendants (folders and documents)
    must be deleted as well
    """
    user = auth_api_client.user
    topmost = await make_folder(title="My Documents", user=user, parent=user.home_folder)
    doc1 = await make_document(title="letter.pdf", user=user, parent=topmost)
    nested_folder = await make_folder(title="Nested Folder", user=user, parent=topmost)
    doc2 = await make_document(title="n1.pdf", user=user, parent=nested_folder)

    response = await auth_api_client.delete("/nodes/", json=[str(topmost.id)])

    assert response.status_code == 200, response.json()

    stmt = select(orm.Node).where(orm.Node.id.in_([doc1.id, doc2.id, nested_folder.id]))
    found = (await db_session.execute(stmt)).scalar()

    assert found is None


async def test_delete_tagged_folder(make_folder, db_session: AsyncSession, user, auth_api_client):
    # Create tagged folder
    folder = await make_folder(title="My Documents", user=user, parent=user.home_folder)

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=folder.id,
        tags=["tag1", "tag2"]
    )

    # Delete folder via API
    response = await auth_api_client.delete(f"/nodes/", json=[str(folder.id)])
    assert response.status_code == 200, response.json()

    # Confirm folder is deleted
    folder_stmt = select(orm.Folder).where(orm.Folder.id == folder.id)
    folder_result = await db_session.execute(folder_stmt)
    deleted_folder = folder_result.scalar_one_or_none()
    assert deleted_folder is None

    # Confirm tags still exist
    for tag_name in ("tag1", "tag2"):
        tag_stmt = select(orm.Tag).where(orm.Tag.name == tag_name)
        tag_result = await db_session.execute(tag_stmt)
        tag = tag_result.scalar_one_or_none()
        assert tag is not None, f"Expected tag '{tag_name}' to exist"


async def test_delete_tagged_document(make_document, db_session: AsyncSession, user, auth_api_client):
    # Create a document
    doc = await make_document(title="My Contract.pdf", user=user, parent=user.home_folder)

    # Assign tags
    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=doc.id,
        tags=["tag1", "tag2"],
    )

    # Delete document via API
    response = await auth_api_client.delete("/nodes/", json=[str(doc.id)])
    assert response.status_code == 200, response.json()

    # Check that the document no longer exists
    stmt_doc = select(orm.Document).where(orm.Document.id == doc.id)
    result_doc = await db_session.execute(stmt_doc)
    deleted_doc = result_doc.scalar_one_or_none()
    assert deleted_doc is None

    # Check that both tags still exist
    for tag_name in ("tag1", "tag2"):
        stmt_tag = select(orm.Tag).where(orm.Tag.name == tag_name)
        result_tag = await db_session.execute(stmt_tag)
        tag = result_tag.scalar_one_or_none()
        assert tag is not None, f"Expected tag '{tag_name}' to still exist"


async def test_get_node_tags_router_when_node_is_folder(
    make_folder, db_session: AsyncSession, user, auth_api_client
):
    folder = await make_folder(title="My Folder", user=user, parent=user.home_folder)

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=folder.id,
        tags=["tag1", "tag2"],
    )

    response = await auth_api_client.get(f"/nodes/{folder.id}/tags")

    assert response.status_code == 200, response.json()
    tag_names = {schema.Tag.model_validate(t).name for t in response.json()}

    assert tag_names == {"tag1", "tag2"}


async def test_get_node_tags_router_when_node_is_document(
    make_document, db_session: AsyncSession, user, auth_api_client
):
    node = await make_document(title="doc.pdf", user=user, parent=user.home_folder)

    await nodes_dbapi.assign_node_tags(
        db_session,
        node_id=node.id,
        tags=["tag1", "tag2"],
    )

    response = await auth_api_client.get(f"/nodes/{node.id}/tags")

    assert response.status_code == 200, response.json()
    tag_names = {schema.Tag.model_validate(t).name for t in response.json()}

    assert tag_names == {"tag1", "tag2"}
