import logging
import os

from fastapi import (Depends, Header, HTTPException, WebSocket,
                     WebSocketException, status)
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import Engine

from papermerge.core import db, schemas
from papermerge.core.db import exceptions as db_exc
from papermerge.core.utils import base64

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False
)


logger = logging.getLogger(__name__)


def get_user_id_from_token(token: str = Depends(oauth2_scheme)) -> str | None:
    if '.' in token:
        _, payload, _ = token.split('.')
        data = base64.decode(payload)
        user_id = data.get("user_id")

        return user_id

    return None


def get_current_user(
    x_remote_user: str | None = Header(default=None),
    token: str | None = Depends(oauth2_scheme),
    engine: Engine = Depends(db.get_engine)
) -> schemas.User:
    if token:  # token found
        user_id = get_user_id_from_token(token)
        if user_id is not None:
            try:
                user = db.get_user(engine, user_id)
            except db_exc.UserNotFound:
                raise HTTPException(
                    status_code=401,
                    detail="User ID not found"
                )
    elif x_remote_user:  # get user from X_REMOTE_USER header
        logger.debug(f"x_remote_user={x_remote_user}")
        user = db.get_user(engine, x_remote_user)

    remote_user_env_var = os.environ.get("REMOTE_USER")

    if user is None and remote_user_env_var:
        user = db.get_user(engine, remote_user_env_var)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="No credentials provided"
        )

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

    user_id = get_user_id_from_token(token)

    if user_id is None:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="user_id is missing"
        )

    try:
        user = db.get_user(engine, user_id)
    except db_exc.UserNotFound:
        raise HTTPException(
            status_code=401,
            detail="Remote user not found"
        )

    return user
