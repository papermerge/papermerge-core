from papermerge.core.features.document.db import api as doc_dbapi


def test_create_document(login_as, db_session, make_user, make_document, make_folder):
    """
    User A should not be able to create nodes in User B's private folders
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
