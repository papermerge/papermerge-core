import json
import base64
from contextlib import asynccontextmanager

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient, ASGITransport

from papermerge.core.db.engine import get_db
from papermerge.core.tests import utils as test_utils


def encode_jwt_payload(payload: dict) -> str:
    """Encode a dict as a JWT payload (base64)."""
    json_str = json.dumps(payload)
    # JWT uses base64url encoding without padding
    encoded = base64.urlsafe_b64encode(json_str.encode()).decode()
    # Remove padding for JWT format
    return encoded.rstrip("=")


def make_jwt_token(payload: dict) -> str:
    """Create a fake JWT token with the given payload."""
    header = encode_jwt_payload({"alg": "RS256", "typ": "JWT"})
    body = encode_jwt_payload(payload)
    signature = "fake_signature"
    return f"{header}.{body}.{signature}"


@pytest.fixture
async def montaigne(make_user):
    return await make_user(username="montaigne")


@pytest.fixture
async def zitadel_login_as(db_session: AsyncSession):
    def override_get_db():
        yield db_session

    @asynccontextmanager
    async def _make(email_address: str):
        app = test_utils.get_app_with_routes()
        app.dependency_overrides[get_db] = override_get_db

        # note that `preferred_username` is missing
        payload = {
            "aud": ["353636209450346660", "353635643823286436"],
            "client_id": "353636209450343469",
            "email": email_address,
            "exp": 1767374734,
            "iat": 1767331534,
            "iss": "https://pmdev-xyzabc.us1.zitadel.cloud",
            "jti": "V2_353723329909136525-at_353723329909202061",
            "nbf": 1767331534,
            # Zitadel returns sub as numeric ID not UUID
            "sub": "952631284495638925",
        }

        token = make_jwt_token(payload)
        transport = ASGITransport(app=app)

        async with AsyncClient(
            transport=transport,
            base_url="http://test",
            headers={"Authorization": f"Bearer {token}"}
        ) as client:
            yield client

        app.dependency_overrides.clear()

    return _make


@pytest.fixture
async def login_with_remote(db_session: AsyncSession):
    def override_get_db():
        yield db_session

    @asynccontextmanager
    async def _make(headers):
        app = test_utils.get_app_with_routes()
        app.dependency_overrides[get_db] = override_get_db

        transport = ASGITransport(app=app)

        async with AsyncClient(
            transport=transport,
            base_url="http://test",
            headers=headers
        ) as client:
            yield client

        app.dependency_overrides.clear()

    return _make
