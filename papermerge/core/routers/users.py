from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException

from papermerge.core import schemas
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


@router.post("/", status_code=201)
def create_user(
    pyuser: schemas.CreateUser,
    user: User = Depends(current_user),
) -> schemas.User:
    """Creates user tag"""
    try:
        created_user = User.objects.create(**pyuser.model_dump())
        created_user.set_password(pyuser.password)
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    return schemas.User.model_validate(created_user)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: UUID,
    user: User = Depends(current_user),
) -> None:
    """Deletes user with given UUID"""
    try:
        User.objects.get(id=user_id).delete()
    except User.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )
