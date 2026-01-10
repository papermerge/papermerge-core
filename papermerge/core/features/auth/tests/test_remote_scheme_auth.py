"""
Test remote scheme authentication with various headers.

Remote scheme authentication allows external authentication systems (like
reverse proxies, OAuth2 Proxy, or SSO gateways) to pass user information
via HTTP headers.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm


async def test_remote_scheme_authentication_with_all_headers(
    login_with_remote,
    db_session: AsyncSession
):
    """
    Test remote scheme authentication with username, groups, roles, name, and email headers.

    This test validates that the RemoteUserScheme correctly extracts user information
    from HTTP headers and authenticates the request.
    """
    # Send request with all remote user headers
    email_address = "montaigne@essays.com"
    headers={
        "X-Forwarded-User": "montaigne",
        "X-Forwarded-Groups": "philosophers,writers",
        "X-Forwarded-Roles": "editor,reviewer",
        "X-Forwarded-Name": "Michel de Montaigne",
        "X-Forwarded-Email": email_address,
    }
    async with login_with_remote(headers) as client:
        response = await client.get("/users/me")
        # Should succeed (not 401 or 500)
        assert response.status_code == 200, f"Auth failed: {response.text}"

    # Should successfully authenticate
    assert response.status_code == 200

    # Verify response contains user data
    data = response.json()
    assert data["username"] == "montaigne"
    assert data["email"] == email_address

    stmt = select(orm.User).where(orm.User.email == email_address)
    created_user = (await db_session.execute(stmt)).scalar_one_or_none()

    assert created_user is not None, "User should be created after authentication"

    # Verify user properties
    assert created_user.email == email_address
