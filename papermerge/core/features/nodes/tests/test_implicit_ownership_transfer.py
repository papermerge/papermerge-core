from sqlalchemy import select
from papermerge.core import orm, schema


def test_upload_document_to_group_home(db_session, make_user, make_group, login_as):
    """
    Documents uploaded in group's home will be automatically owned by the group
    """
    group = make_group("hr", with_special_folders=True)
    user = make_user("john")
    user.groups.append(group)

    db_session.add(user)
    db_session.commit()

    payload = dict(
        ctype="document",
        title="cv.pdf",
        parent_id=str(group.home_folder.id),
    )

    client = login_as(user)

    response = client.post("/nodes/", json=payload)
    assert response.status_code == 201, response.json()

    doc = db_session.scalars(
        select(orm.Document).where(orm.Node.title == "cv.pdf")
    ).one()

    assert doc.group == group  # owned by group
    assert doc.user is None  # not by user

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "hr"


def test_move_document_one_doc_from_private_to_group(
    db_session, make_user, make_group, make_document, login_as
):
    group = make_group("hr", with_special_folders=True)
    user = make_user("john")
    doc = make_document("cv.title", user=user, parent=user.home_folder)
    user.groups.append(group)

    db_session.add(user)
    db_session.commit()

    payload = dict(
        source_ids=[str(doc.id)],
        target_id=str(group.home_folder.id),
    )

    client = login_as(user)

    response = client.post("/nodes/move", json=payload)
    assert response.status_code == 200, response.json()

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "hr"


def test_move_document_one_doc_from_group_to_private(
    db_session, make_user, make_group, make_document, login_as
):
    group = make_group("hr", with_special_folders=True)
    user = make_user("john")
    user.groups.append(group)
    doc = make_document("cv.title", parent=group.home_folder)

    db_session.add(user)
    db_session.commit()

    payload = dict(
        source_ids=[str(doc.id)],
        target_id=str(user.home_folder.id),
    )

    client = login_as(user)

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "hr"

    response = client.post("/nodes/move", json=payload)
    assert response.status_code == 200, response.json()

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "john"


def test_move_nested_nodes_from_private_to_group(
    db_session, make_user, make_group, make_document, make_folder, login_as
):
    group = make_group("hr", with_special_folders=True)
    user = make_user("john")

    folder_1 = make_folder("folder_1", user=user, parent=user.home_folder)
    folder_2 = make_folder("folder_2", user=user, parent=folder_1)
    doc = make_document("cv.title", user=user, parent=folder_2)
    user.groups.append(group)

    db_session.add(user)
    db_session.commit()

    payload = dict(
        source_ids=[str(doc.id)],
        target_id=str(group.home_folder.id),
    )

    client = login_as(user)

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "john"

    response = client.post("/nodes/move", json=payload)
    assert response.status_code == 200, response.json()

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "hr"


def test_move_nested_nodes_from_group_to_private(
    db_session, make_user, make_group, make_document, make_folder, login_as
):
    group = make_group("hr", with_special_folders=True)
    user = make_user("john")

    folder_1 = make_folder("folder_1", group=group, parent=group.home_folder)
    folder_2 = make_folder("folder_2", group=group, parent=folder_1)
    doc = make_document("cv.title", parent=folder_2)
    user.groups.append(group)

    db_session.add(user)
    db_session.commit()

    payload = dict(
        source_ids=[str(doc.id)],
        target_id=str(user.home_folder.id),
    )

    client = login_as(user)

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "hr"

    response = client.post("/nodes/move", json=payload)
    assert response.status_code == 200, response.json()

    response = client.get(f"/documents/{doc.id}")
    assert response.status_code == 200, response.json()

    returned_doc = schema.Document(**response.json())
    assert returned_doc.owner_name == "john"
