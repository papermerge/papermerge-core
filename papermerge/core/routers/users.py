import logging
from typing import Annotated
from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Security
from passlib.hash import pbkdf2_sha256

from papermerge.core import auth, db, schemas, utils
from papermerge.core.auth import scopes
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

logger = logging.getLogger(__name__)


@router.get("/me")
@utils.docstring_parameter(scope=scopes.USER_ME)
def get_current_user(
    user: Annotated[
        schemas.User,
        Security(auth.get_current_user, scopes=[scopes.USER_ME])
    ],
) -> schemas.User:
    """Returns current user

    Required scope: `{scope}`
    """
    logger.debug(f"User {user} found")
    return PyUser.model_validate(user)


@router.get("/", response_model=PaginatorGeneric[PyUser])
@paginate
@utils.docstring_parameter(scope=scopes.USER_VIEW)
def get_users(
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.USER_VIEW])
    ],
    params: CommonQueryParams = Depends()
):
    """Get all users

    Required scope: `{scope}`
    """
    order_by = ['username']

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return User.objects.order_by(*order_by)


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.USER_CREATE)
def create_user(
    pyuser: schemas.CreateUser,
    cur_user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.USER_CREATE])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.User:
    """Creates user

    Required scope: `{scope}`
    """
    try:
        user = db.create_user(
            engine,
            username=pyuser.username,
            email=pyuser.email,
            password=pyuser.password
        )
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    return user


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
@utils.docstring_parameter(scope=scopes.USER_DELETE)
def delete_user(
    user_id: UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.USER_DELETE])
    ],
) -> None:
    """Deletes user

    Required scope: `{scope}`
    """
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
@utils.docstring_parameter(scope=scopes.USER_UPDATE)
def update_user(
    user_id: UUID,
    update_user: schemas.UpdateUser,
    cur_user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.USER_UPDATE])
    ],
) -> schemas.User:
    """Updates user

    Required scope: `{scope}`
    """

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
