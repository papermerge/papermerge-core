import os
import logging
from typing import Annotated
from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy import exc

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
            password=pyuser.password,
            scopes=pyuser.scopes,
            group_ids=pyuser.group_ids
        )
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    return user


@router.get(
    "/{user_id}",
    status_code=201,
    responses={
        404: {
            "description": """No user with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        }
    },
    response_model=schemas.UserDetails
)
@utils.docstring_parameter(scope=scopes.USER_VIEW)
def get_user_details(
    user_id: UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.USER_VIEW])
    ],
    engine: db.Engine = Depends(db.get_engine)
):
    """Get user details

    Required scope: `{scope}`
    """
    try:
        user = db.get_user_details(
            engine,
            user_id=user_id,
        )
    except exc.NoResultFound:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
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
        if os.environ.get('PAPERMERGE__REDIS__URL'):
            delete_user_data.apply_async(
                kwargs={
                    'user_id': str(user_id)
                }
            )
        else:
            delete_user_data(user_id)
    except User.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )


@router.patch(
    "/{user_id}",
    status_code=200,
    response_model=schemas.UserDetails
)
@utils.docstring_parameter(scope=scopes.USER_UPDATE)
def update_user(
    user_id: UUID,
    attrs: schemas.UpdateUser,
    cur_user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.USER_UPDATE])
    ],
    engine: db.Engine = Depends(db.get_engine)
):
    """Updates user

    Required scope: `{scope}`
    """
    try:
        user: schemas.UserDetails = db.update_user(
            engine,
            user_id=user_id,
            attrs=attrs
        )
    except exc.NoResultFound:
        raise HTTPException(
            status_code=404,
            detail="Does not exists"
        )

    return user
