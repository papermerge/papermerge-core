from fastapi import APIRouter, Depends

from papermerge.core.schemas.users import User as PyUser
from papermerge.core.models import User
from papermerge.core.routers.auth import oauth2_scheme
from papermerge.core.routers.auth import get_current_user as current_user

from .paginator import PaginatorGeneric, paginate
from .params import CommonQueryParams


router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/me")
def get_current_user(user: PyUser = Depends(current_user)) -> PyUser:
    """Returns current user"""
    return user


@router.get("/", response_model=PaginatorGeneric[PyUser])
@paginate
def get_users(params: CommonQueryParams = Depends()):
    order_by = ['username']

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return User.objects.order_by(*order_by)
