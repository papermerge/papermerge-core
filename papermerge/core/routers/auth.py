import os

from fastapi import (Depends, Header, HTTPException, WebSocket,
                     WebSocketException, status)
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import Engine

from papermerge.core import auth, db
from papermerge.core.models import User
from papermerge.core.utils import misc as misc_utils

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False
)


# def get_current_user(request: Request) -> User:
#   e.g.
#   user_id = request.headers.get('REMOTE_USER')
def get_current_user(
    x_remote_user: str | None = Header(default=None),
    token: str | None = Depends(oauth2_scheme),
    engine: Engine = Depends(db.get_engine)
) -> User:

    user = None

    if token:  # token found
        user_id = auth.get_user_id_from_token(token)
        if user_id is not None:
            try:
                user = db.get_user(user_id)
            except User.DoesNotExist:
                raise HTTPException(
                    status_code=401,
                    detail="User ID not found"
                )
    elif x_remote_user:  # get user from X_REMOTE_USER header
        user = _get_user_from_str(x_remote_user)

    remote_user_env_var = os.environ.get("REMOTE_USER")

    if user is None and remote_user_env_var:
        user = _get_user_from_str(remote_user_env_var)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="No credentials provided"
        )

    return user


def get_ws_current_user(
    websocket: WebSocket
) -> User:
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

    user_id = auth.get_user_id_from_token(token)

    if user_id is None:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="user_id is missing"
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=401,
            detail="Remote user not found"
        )

    return user


def _get_user_from_str(remote_user: str) -> User:
    if misc_utils(remote_user):
        # x_remote_user is an UUID, lookup user by ID
        try:
            user = User.objects.get(id=remote_user)
        except User.DoesNotExist:
            raise HTTPException(
                status_code=401,
                detail="Remote user ID not found"
            )
    else:
        # x_remote_user is NOT UUID
        # It must be username. Lookup by username.
        try:
            user = User.objects.get(username=remote_user)
        except User.DoesNotExist:
            raise HTTPException(
                status_code=401,
                detail="Remote username not found"
            )

    return user
