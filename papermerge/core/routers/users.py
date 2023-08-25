from fastapi import APIRouter, Depends

from papermerge.core.models import User
from papermerge.core.routers.auth import get_current_user as current_user
from papermerge.core.schemas.users import User as PyUser

from .paginator import PaginatorGeneric, paginate
from .params import CommonQueryParams

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("/me")
def get_current_user(user: User = Depends(current_user)) -> PyUser:
    """Returns current user"""
    return PyUser.model_validate(user)


@router.get("/", response_model=PaginatorGeneric[PyUser])
@paginate
def get_users(params: CommonQueryParams = Depends()):
    order_by = ['username']

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return User.objects.order_by(*order_by)
