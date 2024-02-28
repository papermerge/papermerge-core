from fastapi.testclient import TestClient

from papermerge.core.auth import get_user_id_from_token


def test_get_current_user(token):
    user_id = get_user_id_from_token(token)

    assert user_id is not None


def test_remote_based_authentication(api_client: TestClient):
    response = api_client.get(
        '/users/me/',
        headers={
            'Remote-User': 'socrates'
        }
    )
    assert response.status_code == 200


def test_remote_based_authentication_no_headers(api_client: TestClient):
    response = api_client.get('/users/me/')
    assert response.status_code == 401
