import base64

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from papermerge.core.models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token/")


def get_user_id_from_token(token: str) -> str | None:
    _, payload, _ = token.split('.')
    data = base64.decode(payload)
    user_id = data.get("user_id")

    return user_id


# def get_current_user(request: Request) -> User:
#   e.g.
#   user_id = request.headers.get('REMOTE_USER')
def get_current_user(token: str = Depends(oauth2_scheme)) -> User:

    user_id = get_user_id_from_token(token)

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
