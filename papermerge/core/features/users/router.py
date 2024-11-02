import os
import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security

from papermerge.core.db.engine import Session
from papermerge.core import utils
from papermerge.core.features import auth
from papermerge.core.features.auth import scopes
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.tasks import delete_user_data
from papermerge.core.features.users.db import api as usr_dbapi

from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.paginator import PaginatorGeneric, paginate
from papermerge.core.routers.params import CommonQueryParams

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

logger = logging.getLogger(__name__)


@router.get("/me")
@utils.docstring_parameter(scope=scopes.USER_ME)
def get_current_user(
    user: Annotated[
        usr_schema.User, Security(auth.get_current_user, scopes=[scopes.USER_ME])
    ],
) -> usr_schema.User:
    """Returns current user

    Required scope: `{scope}`
    """
    logger.debug(f"User {user} found")
    return usr_schema.User.model_validate(user)


@router.get("/", response_model=PaginatorGeneric[usr_schema.User])
@paginate
@utils.docstring_parameter(scope=scopes.USER_VIEW)
def get_users(
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.USER_VIEW])
    ],
    params: CommonQueryParams = Depends(),
):
    """Get all users

    Required scope: `{scope}`
    """
    order_by = ["username"]

    if params.order_by:
        order_by = [item.strip() for item in params.order_by.split(",")]

    return User.objects.order_by(*order_by)


@router.get("/all", response_model=list[usr_schema.User])
@utils.docstring_parameter(scope=scopes.USER_VIEW)
def get_users_without_pagination(
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.USER_VIEW])
    ]
):
    """Get all users without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    order_by = ["username"]

    return User.objects.order_by(*order_by)


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.USER_CREATE)
def create_user(
    pyuser: usr_schema.CreateUser,
    cur_user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.USER_CREATE])
    ],
) -> usr_schema.User:
    """Creates user

    Required scope: `{scope}`
    """
    with Session() as db_session:
        user, error = usr_dbapi.create_user(
            db_session,
            username=pyuser.username,
            email=pyuser.email,
            password=pyuser.password,
            scopes=pyuser.scopes,
            group_ids=pyuser.group_ids,
        )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return user


@router.get(
    "/{user_id}",
    status_code=201,
    responses={
        404: {
            "description": """No user with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
    response_model=usr_schema.UserDetails,
)
@utils.docstring_parameter(scope=scopes.USER_VIEW)
def get_user_details(
    user_id: UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.USER_VIEW])
    ],
):
    """Get user details

    Required scope: `{scope}`
    """
    with Session() as db_session:
        user, error = usr_dbapi.get_user_details(
            db_session,
            user_id=user_id,
        )

    if error:
        raise HTTPException(status_code=404, detail=error.model_dump())

    return user


@router.delete(
    "/{user_id}",
    status_code=204,
    responses={
        432: {
            "description": """Deletion is not possible because there is only
             one user left""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        404: {
            "description": """No user with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.USER_DELETE)
def delete_user(
    user_id: UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.USER_DELETE])
    ],
) -> None:
    """Deletes user

    Required scope: `{scope}`
    """
    if User.objects.count() == 1:
        raise HTTPException(
            status_code=432, detail="Deletion not possible. Only one user left."
        )

    try:
        if os.environ.get("PAPERMERGE__REDIS__URL"):
            delete_user_data.apply_async(kwargs={"user_id": str(user_id)})
        else:
            delete_user_data(user_id)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Does not exists")


@router.patch("/{user_id}", status_code=200, response_model=usr_schema.UserDetails)
@utils.docstring_parameter(scope=scopes.USER_UPDATE)
def update_user(
    user_id: UUID,
    attrs: usr_schema.UpdateUser,
    cur_user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.USER_UPDATE])
    ],
) -> usr_schema.UserDetails:
    """Updates user

    Required scope: `{scope}`
    """
    with Session() as db_session:
        user, error = usr_dbapi.update_user(db_session, user_id=user_id, attrs=attrs)

    if error:
        raise HTTPException(status_code=404, detail=error.model_dump())

    return user
