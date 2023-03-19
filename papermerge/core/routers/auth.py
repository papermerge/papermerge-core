from django.conf import settings
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import TypedDict

from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi import APIRouter, Depends, HTTPException, status

from papermerge.core.models import User
from papermerge.core.schemas.users import User as PyUser
from papermerge.core.schemas.token import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token/")
router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = PyUser.from_orm(User.objects.get(username=token_data.username))
    if user is None:
        raise credentials_exception

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

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}
