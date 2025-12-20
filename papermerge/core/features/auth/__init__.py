import logging
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
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

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False,
    scopes=scopes.SCOPES,
)

remote_user_scheme = RemoteUserScheme()

logger = logging.getLogger(__name__)


def extract_token_data(token: str = Depends(oauth2_scheme)) -> types.TokenData | None:
    if "." in token:
        _, payload, _ = token.split(".")
        data = base64.decode(payload)
        user_id: str = data.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing `sub` field",
            )
        token_scopes = data.get("scopes", [])
        groups = data.get("groups", [])
        roles = data.get("roles", [])
        username = data.get("preferred_username", None)
        email = data.get("email", None)

        return types.TokenData(
            scopes=token_scopes,
            user_id=user_id,
            username=username,
            email=email,
            groups=groups,
            roles=roles,
        )


async def get_current_user(
    security_scopes: SecurityScopes,
    remote_user: users_schema.RemoteUser | None = Depends(remote_user_scheme),
    token: str | None = Depends(oauth2_scheme),
    db_session: AsyncSession = Depends(get_db),
) -> users_schema.User:
    user = None
    total_scopes = []
    if token:  # token found
        logger.debug("Non empty token found")
        token_data: types.TokenData = extract_token_data(token)
        logger.debug(f"Token data: {token_data=}")

        if token_data is not None:
            try:
                user = await usr_dbapi.get_user(db_session, token_data.username)
            except NoResultFound:
                logger.debug("No user found. Creating user from token data")
                # create normal user
                user = await usr_dbapi.create_user(
                    db_session,
                    username=token_data.username,
                    email=token_data.email,
                    user_id=UUID(token_data.user_id),
                    password="-",
                )
        total_scopes = token_data.scopes
        # superusers have all privileges
        if user.is_superuser:
            total_scopes.extend(scopes.SCOPES.keys())
        # augment user scopes with permissions associated to local groups
        if len(token_data.groups) > 0:
            s = await usr_dbapi.get_user_scopes_from_groups(
                db_session,
                user_id=UUID(token_data.user_id),
                groups=token_data.groups,
            )
            total_scopes.extend(s)

    elif remote_user:  # get user from headers
        # Using here external identity provider i.e.
        # user management is done in external application
        # If remote_user is not present in our DB then just create it
        # (with its home folder ID, inbox folder ID etc)
        try:
            user = await usr_dbapi.get_user(db_session, remote_user.username)
        except NoResultFound:
            # create normal user
            user = await usr_dbapi.create_user(
                db_session,
                username=remote_user.username,
                email=remote_user.email,
                password="-",
            )
        # superusers have all privileges
        if user.is_superuser:
            total_scopes.extend(scopes.SCOPES.keys())
        # augment user scopes with permissions associated to local roles
        if len(remote_user.roles) > 0:
            s = await usr_dbapi.get_user_scopes_from_roles(
                db_session, user_id=user.id, roles=remote_user.roles
            )
            total_scopes.extend(s)

        if user is None:
            raise HTTPException(status_code=401, detail="No credentials provided")

    if user is None:
        raise exc.HTTP401Unauthorized()

    # User is authenticated.
    # But does he/she has enough permissions?
    for scope in security_scopes.scopes:
        if scope not in total_scopes:
            raise exc.HTTP403Forbidden()

    user.scopes = total_scopes  # is this required?

    return user
