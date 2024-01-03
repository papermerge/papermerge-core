from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException
from passlib.hash import pbkdf2_sha256

from papermerge.core import auth, schemas
from papermerge.core.auth import get_current_user as current_user
from papermerge.core.models import User
from papermerge.core.schemas.users import User as PyUser
from papermerge.core.tasks import delete_user_data

from .common import OPEN_API_GENERIC_JSON_DETAIL
from .paginator import PaginatorGeneric, paginate
from .params import CommonQueryParams

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("/me")
def get_current_user(
    user: schemas.User = Depends(auth.get_current_user)
) -> schemas.User:
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
        created_user.password = pbkdf2_sha256.hash(pyuser.password)
        created_user.save()
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    return schemas.User.model_validate(created_user)


@router.delete(
    "/{user_id}",
    status_code=204,
    responses={
        432: {
            "description": """Deletion is not possible because there is only
             one user left""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        },
        404: {
            "description": """No user with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        }
    }
)
def delete_user(
    user_id: UUID,
    user: User = Depends(current_user),
) -> None:
    """Deletes user with given UUID"""
    if User.objects.count() == 1:
        raise HTTPException(
            status_code=432,
            detail="Deletion not possible. Only one user left."
        )

    try:
        delete_user_data.apply_async(
            kwargs={
                'user_id': str(user_id)
            }
        )
    except User.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )


@router.patch("/{user_id}", status_code=200)
def update_user(
    user_id: UUID,
    update_user: schemas.UpdateUser,
    user: User = Depends(current_user),
) -> schemas.User:
    """Updates user"""

    try:
        qs = User.objects.filter(id=user_id)
        user_record = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )

    qs.update(
        **update_user.model_dump(exclude_unset=True)
    )

    if update_user.password:
        user_record.password = pbkdf2_sha256.hash(update_user.password)
        user_record.save()

    return schemas.User.model_validate(qs.first())
