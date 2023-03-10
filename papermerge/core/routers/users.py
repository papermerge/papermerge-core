from typing import List
from fastapi import APIRouter
from papermerge.core.schemas.users import User as PyUser
from papermerge.core.models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def get_current_user() -> PyUser:
    return PyUser.from_orm(User.objects.first())


@router.get("/")
def get_users() -> List[PyUser]:
    return [PyUser.from_orm(user) for user in User.objects.all()]
