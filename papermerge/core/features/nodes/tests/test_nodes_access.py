from papermerge.core.tests.types import AuthTestClient


def test_node_access(
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
