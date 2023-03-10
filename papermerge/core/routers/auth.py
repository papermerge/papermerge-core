from typing import TypedDict

from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi import APIRouter, Depends, HTTPException

from papermerge.core.models import User
from papermerge.core.schemas.users import User as PyUser


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token/")
router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


def fake_decode_token(token):
    return PyUser.from_orm(User.objects.first())


def get_current_user(token: str = Depends(oauth2_scheme)):
    user = fake_decode_token(token)
    return user


class LoginResponseType(TypedDict):
    access_token: str
    token_type: str


@router.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> LoginResponseType:
    try:
        user = User.objects.get(username=form_data.username)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password"
        )

    if not user.check_password(form_data.password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password"
        )

    return {"access_token": user.username, "token_type": "bearer"}
