import logging
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes

from papermerge.core import types

from papermerge.core.features.users.db import api as usr_dbapi
from papermerge.core.features.users import schema as users_schema
from papermerge.core.features.auth.remote_scheme import RemoteUserScheme
from papermerge.core.features.auth import scopes
from papermerge.core.db import exceptions as db_exc
from papermerge.core.db.engine import Session
from papermerge.core.utils import base64

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False,
    scopes=scopes.SCOPES,
)

remote_user_scheme = RemoteUserScheme()

logger = logging.getLogger(__name__)


def extract_token_data(token: str = Depends(oauth2_scheme)) -> types.TokenData:
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
        username = data.get("preferred_username", None)
        email = data.get("email", None)

        return types.TokenData(
            scopes=token_scopes,
            user_id=user_id,
            username=username,
            email=email,
            groups=groups,
        )


def get_current_user(
    security_scopes: SecurityScopes,
    remote_user: users_schema.RemoteUser | None = Depends(remote_user_scheme),
    token: str | None = Depends(oauth2_scheme),
) -> users_schema.User:
    user = None
    total_scopes = []

    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"

    if token:  # token found
        token_data: types.TokenData = extract_token_data(token)

        if token_data is not None:
            try:
                with Session() as db_session:
                    user = usr_dbapi.get_user(db_session, token_data.username)
            except db_exc.UserNotFound:
                # create normal user
                with Session() as db_session:
                    user = usr_dbapi.create_user(
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
            with Session() as db_session:
                s = usr_dbapi.get_user_scopes_from_groups(
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
            with Session.begin() as db_session:
                user = usr_dbapi.get_user(db_session, remote_user.username)
        except db_exc.UserNotFound:
            # create normal user
            with Session.begin() as db_session:
                user = usr_dbapi.create_user(
                    db_session,
                    username=remote_user.username,
                    email=remote_user.email,
                    password="-",
                )
        # superusers have all privileges
        if user.is_superuser:
            total_scopes.extend(scopes.SCOPES.keys())
        # augment user scopes with permissions associated to local groups
        if len(remote_user.groups) > 0:
            with Session.begin() as db_session:
                s = usr_dbapi.get_user_scopes_from_groups(
                    db_session, user_id=user.id, groups=remote_user.groups
                )
                total_scopes.extend(s)

        if user is None:
            raise HTTPException(status_code=401, detail="No credentials provided")

    for scope in security_scopes.scopes:
        if scope not in total_scopes:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not enough permissions",
                headers={"WWW-Authenticate": authenticate_value},
            )

    user.scopes = total_scopes  # is this required?

    return user
