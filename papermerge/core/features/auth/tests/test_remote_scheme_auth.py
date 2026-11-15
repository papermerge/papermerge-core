"""
Test remote scheme authentication with various headers.

Remote scheme authentication allows external authentication systems (like
reverse proxies, OAuth2 Proxy, or SSO gateways) to pass user information
via HTTP headers.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import orm
from papermerge.core.config import settings


async def test_remote_scheme_authentication_with_all_headers(
    login_with_remote,
    db_session: AsyncSession,
    monkeypatch,
):
    """
    Test remote scheme authentication with username, groups, roles, name, and email headers.

    This test validates that when explicitly enabled with trusted proxies, the RemoteUserScheme
    correctly extracts user information from HTTP headers and authenticates the request.
    """
    monkeypatch.setattr(settings, "remote_user_auth_enabled", True)
    monkeypatch.setattr(settings, "remote_user_trusted_proxies", "testclient,127.0.0.1")
    monkeypatch.setattr(settings, "remote_user_auto_create", True)

    # Send request with all remote user headers
    email_address = "montaigne@essays.com"
    headers = {
        "X-Forwarded-User": "montaigne",
        "X-Forwarded-Groups": "philosophers,writers",
        "X-Forwarded-Roles": "editor,reviewer",
        "X-Forwarded-Name": "Michel de Montaigne",
        "X-Forwarded-Email": email_address,
    }
    async with login_with_remote(headers) as client:
        response = await client.get("/users/me")
        assert response.status_code == 200, f"Auth failed: {response.text}"

    # Verify response contains user data
    data = response.json()
    assert data["username"] == "montaigne"
    assert data["email"] == email_address

    stmt = select(orm.User).where(orm.User.email == email_address)
    created_user = (await db_session.execute(stmt)).scalar_one_or_none()

    assert created_user is not None, "User should be created after authentication"
    assert created_user.email == email_address


async def test_remote_scheme_rejected_by_default(login_with_remote):
    """
    By default, remote user authentication is disabled (remote_user_auth_enabled=False).
    Requests with remote user headers must be rejected with 401 Unauthorized.
    """
    headers = {"X-Forwarded-User": "admin"}
    async with login_with_remote(headers) as client:
        response = await client.get("/users/me")
        assert response.status_code == 401


async def test_remote_scheme_rejected_from_untrusted_proxy(
    login_with_remote, monkeypatch
):
    """
    When remote user auth is enabled but the client host is not trusted,
    the request must be rejected with 401 Unauthorized.
    """
    monkeypatch.setattr(settings, "remote_user_auth_enabled", True)
    monkeypatch.setattr(settings, "remote_user_trusted_proxies", "10.0.0.1")
    headers = {"X-Forwarded-User": "admin"}
    async with login_with_remote(headers) as client:
        response = await client.get("/users/me")
        assert response.status_code == 401


async def test_remote_scheme_superuser_impersonation_blocked(
    login_with_remote, make_user, monkeypatch
):
    """
    When remote user auth is enabled, remote users cannot impersonate a superuser
    unless remote_user_allow_superuser is explicitly enabled.
    """
    await make_user(username="admin", is_superuser=True)
    monkeypatch.setattr(settings, "remote_user_auth_enabled", True)
    monkeypatch.setattr(settings, "remote_user_trusted_proxies", "testclient,127.0.0.1")
    monkeypatch.setattr(settings, "remote_user_allow_superuser", False)

    headers = {"X-Forwarded-User": "admin"}
    async with login_with_remote(headers) as client:
        response = await client.get("/users/me")
        assert response.status_code == 401


async def test_invalid_pat_does_not_fallback_to_remote_user(
    login_with_remote, monkeypatch
):
    """
    Providing an invalid PAT token must immediately return 401 Unauthorized,
    and must NOT fall back to remote user authentication.
    """
    monkeypatch.setattr(settings, "remote_user_auth_enabled", True)
    monkeypatch.setattr(settings, "remote_user_trusted_proxies", "testclient,127.0.0.1")
    headers = {
        "Authorization": "Bearer pm_invalid_token_12345",
        "X-Forwarded-User": "montaigne",
    }
    async with login_with_remote(headers) as client:
        response = await client.get("/users/me")
        assert response.status_code == 401
