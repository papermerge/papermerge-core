"""
Tests for Zitadel OIDC JWT token authentication.

These tests verify that Papermerge correctly handles JWT tokens from Zitadel,
which have different characteristics than tokens from auth-server:

1. Zitadel tokens may not include `preferred_username` claim (only `email`)
2. Zitadel `sub` claim is a numeric string, not a UUID
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm


async def test_zitadel_token_creates_new_user(
    zitadel_login_as,
    db_session: AsyncSession
):
    """
    Test that authenticating with Zitadel token creates a new user.

    This is the main integration test. It verifies that:
    1. A request with Zitadel JWT token succeeds (200 status)
    2. A new user is created in the database
    3. The user's username is set to their email (fallback)
    4. The user's email is correctly set
    5. The user has a valid UUID (database-generated, not from token)

    This test should FAIL until both fixes are applied:
    - username fallback to email in extract_token_data()
    - remove user_id from create_user() in _authenticate_with_jwt()
    """
    email_address = "john@doe"
    # Verify no user exists with this email before the request
    stmt = select(orm.User).where(orm.User.email == email_address)
    existing_user = (await db_session.execute(stmt)).scalar_one_or_none()
    assert existing_user is None, "User should not exist before authentication"

    # Make authenticated request - this triggers get_current_user
    async with zitadel_login_as(email_address) as client:
        response = await client.get("/users/me")
        # Should succeed (not 401 or 500)
        assert response.status_code == 200, f"Auth failed: {response.text}"

    # Verify user was created
    stmt = select(orm.User).where(orm.User.email == email_address)
    created_user = (await db_session.execute(stmt)).scalar_one_or_none()

    assert created_user is not None, "User should be created after authentication"

    # Verify user properties
    assert created_user.email == email_address
    # Username should fall back to email since preferred_username is missing
    assert created_user.username == email_address

    # Verify UUID is valid (database-generated, not Zitadel's numeric ID)
    assert isinstance(created_user.id, uuid.UUID)
