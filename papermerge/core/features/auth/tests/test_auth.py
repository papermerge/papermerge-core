from httpx import AsyncClient

from papermerge.core import types
from papermerge.core.features.auth import extract_token_data
from papermerge.core.features.users.db.orm import User


async def test_get_current_user(token):
    token_data: types.TokenData = extract_token_data(token)

    assert token_data is not None


async def test_remote_based_authentication(montaigne: User, api_client: AsyncClient):
    response = await api_client.get("/users/me", headers={"X-Forwarded-User": "montaigne"})
    assert response.status_code == 200


async def test_remote_based_authentication_no_headers(api_client: AsyncClient):
    response = await api_client.get("/users/me")
    assert response.status_code == 401
