from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.tests.types import AuthTestClient


async def test_get_node(
    auth_api_client: AuthTestClient, make_user, make_folder, make_document, db_session: AsyncSession
):
    """
    User A should not have access to user B's private nodes
    """
    user_b = await make_user("user_b", is_superuser=False)
    user_b_folder = await make_folder(
        "user_b_private_folder", user=user_b, parent=user_b.home_folder
    )
    await make_document("user_b_private_doc", user=user_b, parent=user_b_folder)

    # Act
    response = await auth_api_client.get(f"/nodes/{user_b_folder.id}")

    assert response.status_code == 403


async def test_post_node(
    login_as,
    make_user,
    make_folder,
    pdf_file
):
    """
    User B should not be able to create nodes in User A's private folders
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder = await make_folder(
        "folder_a", parent=user_a.home_folder, user=user_a
    )

    files = {
        "file": pdf_file.as_upload_tuple()
    }

    data = {
        "title": "doc_user_b.pdf",
        "parent_id": str(user_a_private_folder.id),
    }

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.post(
        "/documents/upload",
        data=data,
        files=files
    )

    assert response.status_code == 403


async def test_update_node(login_as, make_user, make_folder):
    """
    User B should not be able to update User A's private nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder = await make_folder(
        "folder_a", parent=user_a.home_folder, user=user_a
    )

    payload = {
        "title": "renamed-by-user-b.pdf",
        "parent_id": str(user_a_private_folder.id),
    }

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.patch(
        f"/nodes/{user_a_private_folder.id}",
        json=payload,
    )

    assert response.status_code == 403


async def test_delete_node(login_as, make_user, make_folder):
    """
    User B should not be able to delete User A's private nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder_1 = await make_folder(
        "folder_a_1", parent=user_a.home_folder, user=user_a
    )
    user_a_private_folder_2 = await make_folder(
        "folder_a_2", parent=user_a.home_folder, user=user_a
    )

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.delete(
        "/nodes/",
        json=[
            str(user_a_private_folder_1.id),
            str(user_a_private_folder_2.id),
        ],
    )

    assert response.status_code == 403


async def test_get_node_details(login_as, make_user, make_folder):
    """
    User B should not be able to retrieve details of User A's private nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder_1 = await make_folder(
        "folder_a_1", parent=user_a.home_folder, user=user_a
    )
    user_a_private_folder_2 = await make_folder(
        "folder_a_2", parent=user_a.home_folder, user=user_a
    )

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.get(
        f"/nodes/?node_ids={user_a_private_folder_1.id}&node_ids={user_a_private_folder_2.id}",
    )

    assert response.status_code == 403


async def test_move_node(login_as, make_user, make_folder, make_document):
    """
    User B should not be able to move User A's private nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder_src = await make_folder(
        "folder_src", parent=user_a.home_folder, user=user_a
    )
    user_a_private_folder_dst = await make_folder(
        "folder_dst", parent=user_a.home_folder, user=user_a
    )

    user_a_doc = await make_document("src.pdf", parent=user_a_private_folder_src, user=user_a)

    user_b_api_client = await login_as(user_b)
    payload = {
        "source_ids": [str(user_a_doc.id)],
        "target_id": str(user_a_private_folder_dst.id),
    }

    response = await user_b_api_client.post(
        "/nodes/move",
        json=payload,
    )

    assert response.status_code == 403, response.json()


async def test_assign_node_tags(login_as, make_user, make_folder):
    """
    User B should not be able to assign tags to User A's private nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder = await make_folder(
        "folder", parent=user_a.home_folder, user=user_a
    )

    user_b_api_client = await login_as(user_b)
    payload = ["coco", "jumbo"]

    response = await user_b_api_client.post(
        f"/nodes/{user_a_private_folder.id}/tags",
        json=payload,
    )

    assert response.status_code == 400, response.json()


async def test_update_node_tags(login_as, make_user, make_folder):
    """
    User B should not be able to change tags associated to the User A's private
    nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder = await make_folder(
        "folder", parent=user_a.home_folder, user=user_a
    )

    user_b_api_client = await login_as(user_b)
    payload = ["coco", "jumbo"]

    response = await user_b_api_client.patch(
        f"/nodes/{user_a_private_folder.id}/tags",
        json=payload,
    )

    assert response.status_code == 400, response.json()


async def test_get_node_tags(login_as, make_user, make_folder):
    """
    User B should not be able to get tags associated to the User A's private
    nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder = await make_folder(
        "folder", parent=user_a.home_folder, user=user_a
    )

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.get(
        f"/nodes/{user_a_private_folder.id}/tags",
    )

    assert response.status_code == 403, response.json()


async def test_remove_node_tags(login_as, make_user, make_folder):
    """
    User B should not be able to remove tags associated to the User A's private
    nodes
    """

    user_a = await make_user("user_a", is_superuser=True)
    user_b = await make_user("user_b", is_superuser=True)
    user_a_private_folder = await make_folder(
        "folder", parent=user_a.home_folder, user=user_a
    )

    user_b_api_client = await login_as(user_b)

    response = await user_b_api_client.delete(
        f"/nodes/{user_a_private_folder.id}/tags", json=["tag1"]
    )

    assert response.status_code == 400, response.json()
