from papermerge.core.routers.auth import get_user_id_from_token


def test_get_current_user(token):
    user_id = get_user_id_from_token(token)

    assert user_id is not None
