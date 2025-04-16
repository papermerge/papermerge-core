from papermerge.core.tests.types import AuthTestClient


def test_get_node(
    auth_api_client: AuthTestClient, make_user, make_folder, make_document, db_session
):
    """
    User A should not have access to user B's private nodes
    """
    user_b = make_user("user_b", is_superuser=False)
    user_b_folder = make_folder(
        "user_b_private_folder", user=user_b, parent=user_b.home_folder
    )
    make_document("user_b_private_doc", user=user_b, parent=user_b_folder)

    # Act
    response = auth_api_client.get(f"/nodes/{user_b_folder.id}")

    assert response.status_code == 403


def test_post_node(login_as, make_user, make_folder):
    """
    User B should not be able to create nodes in User A's private folders
    """

    user_a = make_user("user_a", is_superuser=True)
    user_b = make_user("user_b", is_superuser=True)
    user_a_private_folder = make_folder(
        "folder_a", parent=user_a.home_folder, user=user_a
    )

    payload = {
        "ctype": "document",
        "title": "doc_user_b.pdf",
        "parent_id": str(user_a_private_folder.id),
    }

    user_b_api_client = login_as(user_b)

    response = user_b_api_client.post("/nodes", json=payload)

    assert response.status_code == 403


def test_update_node(login_as, make_user, make_folder):
    """
    User B should not be able to update User A's private nodes
    """

    user_a = make_user("user_a", is_superuser=True)
    user_b = make_user("user_b", is_superuser=True)
    user_a_private_folder = make_folder(
        "folder_a", parent=user_a.home_folder, user=user_a
    )

    payload = {
        "title": "renamed-by-user-b.pdf",
        "parent_id": str(user_a_private_folder.id),
    }

    user_b_api_client = login_as(user_b)

    response = user_b_api_client.patch(
        f"/nodes/{user_a_private_folder.id}",
        json=payload,
    )

    assert response.status_code == 403


def test_delete_node(login_as, make_user, make_folder):
    """
    User B should not be able to delete User A's private nodes
    """

    user_a = make_user("user_a", is_superuser=True)
    user_b = make_user("user_b", is_superuser=True)
    user_a_private_folder_1 = make_folder(
        "folder_a_1", parent=user_a.home_folder, user=user_a
    )
    user_a_private_folder_2 = make_folder(
        "folder_a_2", parent=user_a.home_folder, user=user_a
    )

    user_b_api_client = login_as(user_b)

    response = user_b_api_client.delete(
        "/nodes/",
        json=[
            str(user_a_private_folder_1.id),
            str(user_a_private_folder_2.id),
        ],
    )

    assert response.status_code == 403
