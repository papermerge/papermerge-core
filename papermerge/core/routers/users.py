from typing import List
from fastapi import APIRouter, Depends
from papermerge.core.schemas.users import User as PyUser
from papermerge.core.models import User
from papermerge.core.routers.auth import oauth2_scheme
from papermerge.core.routers.auth import get_current_user as current_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/me")
def get_current_user(user: User = Depends(current_user)) -> PyUser:
    """Returns current user"""
    return user


@router.get("/")
def get_users() -> List[PyUser]:
    return [PyUser.from_orm(user) for user in User.objects.all()]
