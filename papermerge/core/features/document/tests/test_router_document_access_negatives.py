from papermerge.core.features.document import schema


def test_update_cf(make_user, make_document, login_as):
    """
    User B should not be able to update user's A private docs cf
    """
    user_a = make_user("user_a", is_superuser=True)
    user_b = make_user("user_b", is_superuser=True)
    doc = make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = login_as(user_b)
    payload = [
        schema.DocumentCustomFieldsUpdate(key="asn", value="D123354").model_dump()
    ]

    response = user_b_api_client.patch(
        f"/documents/{doc.id}/custom-fields", json=payload
    )

    assert response.status_code == 403, response.json()


def test_get_cf(make_user, make_document, login_as):
    """
    User B should not be able to get user's A private docs cf
    """
    user_a = make_user("user_a", is_superuser=True)
    user_b = make_user("user_b", is_superuser=True)
    doc = make_document("doc.pdf", parent=user_a.home_folder, user=user_a)

    user_b_api_client = login_as(user_b)

    response = user_b_api_client.get(f"/documents/{doc.id}/custom-fields")

    assert response.status_code == 403, response.json()
