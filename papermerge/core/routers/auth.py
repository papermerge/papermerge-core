
from fastapi import (Depends, Header, HTTPException, WebSocket,
                     WebSocketException, status)
from fastapi.security import OAuth2PasswordBearer

from papermerge.core.models import User
from papermerge.core.utils import base64

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False
)


def get_user_id_from_token(token: str) -> str | None:
    _, payload, _ = token.split('.')
    data = base64.decode(payload)
    user_id = data.get("user_id")

    return user_id


# def get_current_user(request: Request) -> User:
#   e.g.
#   user_id = request.headers.get('REMOTE_USER')
def get_current_user(
    x_remote_user: str | None = Header(default=None),
    token: str | None = Depends(oauth2_scheme)
) -> User:

    user_id = None

    if token:  # token found
        user_id = get_user_id_from_token(token)

    if x_remote_user:  # remote user UUID
        user_id = x_remote_user

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="REMOTE_USER header is empty"
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=401,
            detail="Remote user not found"
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

    user_id = get_user_id_from_token(token)

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
