"""
Tests for API Tokens (PAT) feature.
"""
import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.api_tokens.db import api as dbapi
from papermerge.core.features.api_tokens.db.orm import APIToken
from papermerge.core.features.users.db.orm import User


class TestTokenGeneration:
    """Test token generation utilities."""

    def test_generate_token_format(self):
        """Token should have correct format: pm_<random>"""
        full_token, token_hash, token_prefix = dbapi.generate_token()

        assert full_token.startswith("pm_")
        assert len(full_token) > 40  # pm_ + 32 bytes base64
        assert len(token_hash) == 64  # SHA256 hex
        assert len(token_prefix) == 8

    def test_generate_token_uniqueness(self):
        """Each call should generate unique tokens."""
        tokens = [dbapi.generate_token() for _ in range(100)]
        full_tokens = [t[0] for t in tokens]
        hashes = [t[1] for t in tokens]

        assert len(set(full_tokens)) == 100
        assert len(set(hashes)) == 100

    def test_is_pat_token(self):
        """Should correctly identify PAT tokens."""
        assert dbapi.is_pat_token("pm_abc123") is True
        assert dbapi.is_pat_token("pm_") is True
        assert dbapi.is_pat_token("Bearer pm_abc") is False  # Full header
        assert dbapi.is_pat_token("eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.xxx.yyy") is False
        assert dbapi.is_pat_token("") is False

    def test_hash_token_consistency(self):
        """Hashing same token should produce same hash."""
        token = "pm_test123"
        hash1 = dbapi.hash_token(token)
        hash2 = dbapi.hash_token(token)
        assert hash1 == hash2


class TestTokenCRUD:
    """Test database CRUD operations for tokens."""

    @pytest.fixture
    async def test_user(self, db_session: AsyncSession, make_user) -> User:
        """Create a test user."""
        return await make_user("token_test_user")

    async def test_create_token(self, db_session: AsyncSession, test_user: User):
        """Should create a token and return the full token once."""
        api_token, full_token = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="Test Token",
        )

        assert api_token.id is not None
        assert api_token.user_id == test_user.id
        assert api_token.name == "Test Token"
        assert full_token.startswith("pm_")
        assert api_token.token_prefix in full_token

    async def test_create_token_with_scopes(
        self, db_session: AsyncSession, test_user: User
    ):
        """Should store scopes correctly."""
        api_token, _ = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="Scoped Token",
            scopes=["node.view", "node.create"],
        )

        assert api_token.scopes == "node.view,node.create"
        assert api_token.scope_list == ["node.view", "node.create"]

    async def test_create_token_with_expiration(
        self, db_session: AsyncSession, test_user: User
    ):
        """Should store expiration correctly."""
        expires = datetime.now(timezone.utc) + timedelta(days=30)

        api_token, _ = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="Expiring Token",
            expires_at=expires,
        )

        assert api_token.expires_at is not None
        assert api_token.is_expired is False

    async def test_get_token_by_hash(self, db_session: AsyncSession, test_user: User):
        """Should retrieve token by hash."""
        api_token, full_token = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="Lookup Token",
        )

        token_hash = dbapi.hash_token(full_token)
        found = await dbapi.get_token_by_hash(db_session, token_hash)

        assert found is not None
        assert found.id == api_token.id

    async def test_get_user_tokens(self, db_session: AsyncSession, test_user: User):
        """Should list all tokens for a user."""
        # Create multiple tokens
        for i in range(3):
            await dbapi.create_api_token(
                db_session,
                user_id=test_user.id,
                name=f"Token {i}",
            )

        tokens = await dbapi.get_user_tokens(db_session, test_user.id)
        assert len(tokens) == 3

    async def test_delete_token(self, db_session: AsyncSession, test_user: User):
        """Should delete token."""
        api_token, _ = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="To Delete",
        )

        deleted = await dbapi.delete_token(db_session, api_token.id, test_user.id)
        assert deleted is True

        # Should not find it anymore
        tokens = await dbapi.get_user_tokens(db_session, test_user.id)
        assert len(tokens) == 0

    async def test_delete_token_wrong_user(
        self, db_session: AsyncSession, test_user: User
    ):
        """Should not delete token owned by another user."""
        api_token, _ = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="Protected Token",
        )

        other_user_id = uuid4()
        deleted = await dbapi.delete_token(db_session, api_token.id, other_user_id)
        assert deleted is False


class TestTokenValidation:
    """Test token validation logic."""

    @pytest.fixture
    async def test_user(self, db_session: AsyncSession, make_user) -> User:
        return await make_user("validation_test_user")

    async def test_validate_valid_token(
        self, db_session: AsyncSession, test_user: User
    ):
        """Should validate a correct token."""
        _, full_token = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="Valid Token",
        )

        api_token = await dbapi.validate_token(db_session, full_token)

        assert api_token is not None
        assert api_token.user_id == test_user.id

    async def test_validate_invalid_token(self, db_session: AsyncSession):
        """Should reject invalid token."""
        api_token = await dbapi.validate_token(db_session, "pm_invalid_token")
        assert api_token is None

    async def test_validate_non_pat_token(self, db_session: AsyncSession):
        """Should reject non-PAT tokens."""
        jwt_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.xxx.yyy"
        api_token = await dbapi.validate_token(db_session, jwt_token)
        assert api_token is None

    async def test_validate_expired_token(
        self, db_session: AsyncSession, test_user: User
    ):
        """Should reject expired token."""
        # Create already-expired token
        expires = datetime.now(timezone.utc) - timedelta(days=1)
        _, full_token = await dbapi.create_api_token(
            db_session,
            user_id=test_user.id,
            name="Expired Token",
            expires_at=expires,
        )

        api_token = await dbapi.validate_token(db_session, full_token)
        assert api_token is None


class TestAPIEndpoints:
    """Test REST API endpoints."""

    async def test_create_token_endpoint(self, auth_api_client: AsyncClient):
        """Should create token via API."""
        response = await auth_api_client.post(
            "/tokens",
            json={"name": "API Test Token"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "API Test Token"
        assert "token" in data
        assert data["token"].startswith("pm_")

    async def test_create_token_with_options(self, auth_api_client: AsyncClient):
        """Should create token with scopes and expiration."""
        response = await auth_api_client.post(
            "/tokens",
            json={
                "name": "Scoped Token",
                "scopes": ["node.view"],
                "expires_in_days": 30,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["scopes"] == ["node.view"]
        assert data["expires_at"] is not None

    async def test_list_tokens_endpoint(self, auth_api_client: AsyncClient):
        """Should list user's tokens."""
        # Create a token first
        await auth_api_client.post("/tokens", json={"name": "Token 1"})

        response = await auth_api_client.get("/tokens")

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        # Token value should NOT be included in list
        assert "token" not in data[0]

    async def test_delete_token_endpoint(self, auth_api_client: AsyncClient):
        """Should delete token via API."""
        # Create a token
        create_response = await auth_api_client.post(
            "/tokens",
            json={"name": "To Delete"},
        )
        token_id = create_response.json()["id"]

        # Delete it
        response = await auth_api_client.delete(f"/tokens/{token_id}")

        assert response.status_code == 200
        assert response.json()["message"] == "Token successfully revoked"

    async def test_use_pat_for_authentication(
        self, api_client: AsyncClient, auth_api_client: AsyncClient
    ):
        """Should be able to use PAT for API authentication."""
        # Create a token (authenticated)
        create_response = await auth_api_client.post(
            "/tokens",
            json={"name": "Auth Test Token"},
        )
        full_token = create_response.json()["token"]

        # Use PAT to access API (unauthenticated client + PAT header)
        response = await api_client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {full_token}"},
        )

        assert response.status_code == 200
