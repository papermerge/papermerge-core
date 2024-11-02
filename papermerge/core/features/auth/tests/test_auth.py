import pytest
from fastapi.testclient import TestClient

from papermerge.core import types
from papermerge.core.features.auth import extract_token_data
from papermerge.core.features.users.db.orm import User


def test_get_current_user(token):
    token_data: types.TokenData = extract_token_data(token)

    assert token_data is not None


def test_remote_based_authentication(montaigne: User, api_client: TestClient):
    response = api_client.get("/users/me/", headers={"Remote-User": "montaigne"})
    assert response.status_code == 200


def test_remote_based_authentication_no_headers(api_client: TestClient):
    response = api_client.get("/users/me/")
    assert response.status_code == 401
