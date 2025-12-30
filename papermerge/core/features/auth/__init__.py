"""
Authentication module for Papermerge.

Supports three authentication methods (in priority order):
1. Personal Access Tokens (PAT) - tokens starting with "pm_"
2. OIDC/JWT tokens - tokens containing dots (from OAuth2-Proxy or auth-server)
3. Remote-User headers - from trusted proxy (OAuth2-Proxy with OIDC)

PAT tokens are identified by their "pm_" prefix and are validated against
the api_tokens table. They provide a simple way for CLI tools and scripts
to authenticate without browser-based OIDC flows.
"""
import logging
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes, HTTPBearer, \
    HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

from papermerge.core import exceptions as exc
from papermerge.core import types
from papermerge.core.features.users.db import api as usr_dbapi
from papermerge.core.features.users import schema as users_schema
from papermerge.core.features.auth.remote_scheme import RemoteUserScheme
from papermerge.core.features.auth import scopes
from papermerge.core.utils import base64
from papermerge.core.db.engine import get_db
# Import PAT validation
from papermerge.core.features.api_tokens.db.api import is_pat_token, \
    validate_token

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False,
    scopes=scopes.SCOPES,
)

remote_user_scheme = RemoteUserScheme()
http_bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Enter your Personal Access Token (PAT): pm_xxxxx...",
)


async def get_token_from_request(
    bearer_auth: HTTPAuthorizationCredentials | None = Depends(http_bearer_scheme),
) -> str | None:
    """
    Extract token from HTTP Bearer scheme.
    """
    if bearer_auth and bearer_auth.credentials:
        return bearer_auth.credentials
    return None


def extract_token_data(token: str) -> types.TokenData | None:
    """
    Extract user data from a JWT token.

    This handles tokens from:
    - auth-server (docker/standard setup)
    - OIDC providers via OAuth2-Proxy (docker/oidc setup)

    Note: We only decode the payload - we don't verify the signature.
    Signature verification is handled by:
    - auth-server's /verify endpoint (standard setup)
    - OAuth2-Proxy (OIDC setup)
    """
    logger.debug(
        f"extract_token_data called with token: {token[:50] if token else 'None'}..."
    )

    if "." not in token:
        logger.error(f"Token doesn't contain dots: {token[:20]}...")
        return None

    logger.debug("Token contains dots, splitting...")
    parts = token.split(".")
    logger.debug(f"Token split into {len(parts)} parts")

    if len(parts) != 3:
        logger.error(f"Token has {len(parts)} parts, expected 3")
        return None

    _, payload, _ = parts
    logger.debug(f"Decoding payload: {payload[:50]}...")

    try:
        data = base64.decode(payload)
    except Exception as e:
        logger.error(f"Failed to decode token payload: {e}")
        return None

    logger.debug(f"Decoded data: {data}")

    user_id: str = data.get("sub")
    if user_id is None:
        logger.error("Token is missing 'sub' field")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is missing `sub` field",
        )

    token_scopes = data.get("scopes", [])
    groups = data.get("groups", [])
    roles = data.get("roles", [])
    username = data.get("preferred_username", None)
    email = data.get("email", None)

    logger.debug(f"Extracted username={username}, email={email}, groups={groups}")

    return types.TokenData(
        scopes=token_scopes,
        user_id=user_id,
        username=username,
        email=email,
        groups=groups,
        roles=roles,
    )


async def _authenticate_with_pat(
    token: str,
    db_session: AsyncSession,
    security_scopes: SecurityScopes,
) -> users_schema.User | None:
    """
    Authenticate using a Personal Access Token.

    Returns the user if authentication succeeds, None otherwise.
    """
    logger.debug("Attempting PAT authentication")

    api_token = await validate_token(db_session, token)
    if api_token is None:
        logger.debug("PAT validation failed")
        return None

    logger.debug(f"PAT validated for user_id={api_token.user_id}")

    # Get the user
    try:
        user = await usr_dbapi.get_user_by_id(db_session, api_token.user_id)
    except NoResultFound:
        logger.error(f"User {api_token.user_id} not found for valid PAT")
        return None

    # Build scopes list
    total_scopes = []

    # If token has specific scopes, use those
    if api_token.scopes:
        total_scopes = api_token.scope_list
    else:
        # Otherwise, inherit user's scopes
        if user.is_superuser:
            total_scopes = list(scopes.SCOPES.keys())
        else:
            # Get scopes from user's roles
            user_scopes = await usr_dbapi.get_user_scopes_from_roles(
                db_session,
                user_id=user.id,
                roles=[r.name for r in user.roles] if hasattr(user, "roles") else [],
            )
            total_scopes = list(user_scopes)

    # Check if token has required scopes
    for scope in security_scopes.scopes:
        if scope not in total_scopes:
            logger.warning(
                f"PAT missing required scope: {scope}. Token scopes: {total_scopes}"
            )
            raise exc.HTTP403Forbidden()

    # Convert ORM user to schema user with scopes
    user_schema = users_schema.User.model_validate(user)
    user_schema.scopes = total_scopes

    return user_schema


async def _authenticate_with_jwt(
    token: str,
    db_session: AsyncSession,
    security_scopes: SecurityScopes,
) -> users_schema.User | None:
    """
    Authenticate using a JWT token (from auth-server or OIDC provider).

    Returns the user if authentication succeeds, None otherwise.
    """
    logger.debug("Attempting JWT authentication")

    token_data = extract_token_data(token)
    if token_data is None:
        return None

    logger.debug(f"Token data extracted: {token_data}")

    # Get or create user
    try:
        user = await usr_dbapi.get_user(db_session, token_data.username)
    except NoResultFound:
        logger.debug(f"User {token_data.username} not found, creating...")
        user = await usr_dbapi.create_user(
            db_session,
            username=token_data.username,
            email=token_data.email,
            user_id=UUID(token_data.user_id),
            password="-",
        )

    # Build scopes list
    total_scopes = list(token_data.scopes)

    if user.is_superuser:
        total_scopes.extend(scopes.SCOPES.keys())

    if len(token_data.roles) > 0:
        role_scopes = await usr_dbapi.get_user_scopes_from_roles(
            db_session,
            user_id=UUID(token_data.user_id),
            roles=token_data.roles,
        )
        total_scopes.extend(role_scopes)

    # Check required scopes
    for scope in security_scopes.scopes:
        if scope not in total_scopes:
            raise exc.HTTP403Forbidden()

    user.scopes = total_scopes
    return user


async def _authenticate_with_remote_user(
    remote_user: users_schema.RemoteUser,
    db_session: AsyncSession,
    security_scopes: SecurityScopes,
) -> users_schema.User | None:
    """
    Authenticate using Remote-User header (from OAuth2-Proxy).

    Returns the user if authentication succeeds, None otherwise.
    """
    logger.debug(f"Attempting Remote-User authentication for {remote_user.username}")

    # Get or create user
    try:
        user = await usr_dbapi.get_user(db_session, remote_user.username)
    except NoResultFound:
        logger.debug(f"User {remote_user.username} not found, creating...")
        user = await usr_dbapi.create_user(
            db_session,
            username=remote_user.username,
            email=remote_user.email,
            password="-",
        )

    # Build scopes list
    total_scopes = []

    if user.is_superuser:
        total_scopes.extend(scopes.SCOPES.keys())

    if len(remote_user.roles) > 0:
        role_scopes = await usr_dbapi.get_user_scopes_from_roles(
            db_session,
            user_id=user.id,
            roles=remote_user.roles,
        )
        total_scopes.extend(role_scopes)

    # Check required scopes
    for scope in security_scopes.scopes:
        if scope not in total_scopes:
            raise exc.HTTP403Forbidden()

    user.scopes = total_scopes
    return user


async def get_current_user(
    security_scopes: SecurityScopes,
    request: Request,
    remote_user: users_schema.RemoteUser | None = Depends(remote_user_scheme),
    token: str | None = Depends(get_token_from_request),
    db_session: AsyncSession = Depends(get_db),
) -> users_schema.User:
    """
    Get the current authenticated user.

    Authentication methods are tried in this order:
    1. PAT token (if token starts with "pm_")
    2. JWT token (if token contains dots)
    3. Remote-User header (from trusted proxy)

    This allows:
    - CLI tools to use PAT tokens
    - Web users to use OIDC (via OAuth2-Proxy)
    - auth-server setup to work with JWT tokens
    """
    user = None

    logger.debug(
        f"get_current_user called: token={'present' if token else 'None'}, "
        f"remote_user={'present' if remote_user else 'None'}"
    )
    logger.debug(f"Request headers: {dict(request.headers)}")

    if token:
        # Check if it's a PAT token first
        if is_pat_token(token):
            logger.debug("Token identified as PAT")
            user = await _authenticate_with_pat(token, db_session, security_scopes)
        else:
            # Try JWT authentication
            logger.debug("Token identified as JWT")
            user = await _authenticate_with_jwt(token, db_session, security_scopes)

    # Fall back to Remote-User header
    if user is None and remote_user:
        logger.debug("Falling back to Remote-User authentication")
        user = await _authenticate_with_remote_user(
            remote_user, db_session, security_scopes
        )

    if user is None:
        logger.debug("All authentication methods failed")
        raise exc.HTTP401Unauthorized()

    logger.debug(f"Authentication successful for user: {user.username}")
    return user
