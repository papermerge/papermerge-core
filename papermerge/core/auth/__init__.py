import logging
from uuid import UUID

from fastapi import (Depends, HTTPException, WebSocket, WebSocketException,
                     status)
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from sqlalchemy import Engine

from papermerge.core import db, schemas, types
from papermerge.core.auth import scopes
from papermerge.core.auth.remote_scheme import RemoteUserScheme
from papermerge.core.db import exceptions as db_exc
from papermerge.core.utils import base64

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False,
    scopes=scopes.SCOPES,
)

remote_user_scheme = RemoteUserScheme()

logger = logging.getLogger(__name__)


def extract_token_data(token: str = Depends(oauth2_scheme)) -> types.TokenData:
    if '.' in token:
        _, payload, _ = token.split('.')
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
            groups=groups
        )


def get_current_user(
    security_scopes: SecurityScopes,
    remote_user: schemas.RemoteUser | None = Depends(remote_user_scheme),
    token: str | None = Depends(oauth2_scheme),
    engine: Engine = Depends(db.get_engine)
) -> schemas.User:

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
                user = db.get_user(engine, token_data.username)
            except db_exc.UserNotFound:
                # create normal user
                user = db.create_user(
                    engine,
                    username=token_data.username,
                    email=token_data.email,
                    user_id=UUID(token_data.user_id),
                    password='-',
                )
        total_scopes = token_data.scopes
        # superusers have all privileges
        if user.is_superuser:
            total_scopes.extend(scopes.SCOPES.keys())
        # augment user scopes with permissions associated to local groups
        if len(token_data.groups) > 0:
            total_scopes.extend(
                db.get_user_scopes_from_groups(
                    engine=engine,
                    user_id=UUID(token_data.user_id),
                    groups=token_data.groups
                )
            )

    elif remote_user:  # get user from headers
        # Using here external identity provider i.e.
        # user management is done in external application
        # If remote_user is not present in our DB then just create it
        # (with its home folder ID, inbox folder ID etc)
        try:
            user = db.get_user(engine, remote_user.username)
        except db_exc.UserNotFound:
            # create normal user
            user = db.create_user(
                engine,
                username=remote_user.username,
                email=remote_user.email,
                password='-',
            )
        # superusers have all privileges
        if user.is_superuser:
            total_scopes.extend(scopes.SCOPES.keys())
        # augment user scopes with permissions associated to local groups
        if len(remote_user.groups) > 0:
            total_scopes.extend(
                db.get_user_scopes_from_groups(
                    engine=engine,
                    user_id=user.id,
                    groups=remote_user.groups
                )
            )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="No credentials provided"
        )

    for scope in security_scopes.scopes:
        if scope not in total_scopes:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not enough permissions",
                headers={"WWW-Authenticate": authenticate_value},
            )

    user.scopes = total_scopes  # is this required?

    return user


def get_ws_current_user(
    websocket: WebSocket,
    engine: Engine = Depends(db.get_engine)
) -> schemas.User:
    token = None
    authorization_header = websocket.headers.get('authorization', None)
    cookie = websocket.cookies.get('access_token')

    if authorization_header:
        parts = authorization_header.split(' ')
        if len(parts) == 2:
            token = parts[1].strip()
    elif cookie:
        token = cookie

    if token is None:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="token is missing"
        )

    token_data = extract_token_data(token)

    try:
        user = db.get_user(engine, token_data.user_id)
    except db_exc.UserNotFound:
        raise HTTPException(
            status_code=401,
            detail="Remote user not found"
        )

    return user
