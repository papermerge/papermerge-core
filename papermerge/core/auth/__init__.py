import os

from fastapi import Depends, Header, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import Engine

from papermerge.core import db, schemas
from papermerge.core.utils import base64

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token/",
    auto_error=False
)


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
            except Exception:
                raise HTTPException(
                    status_code=401,
                    detail="User ID not found"
                )
    elif x_remote_user:  # get user from X_REMOTE_USER header
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
