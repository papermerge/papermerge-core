import os
import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import schema, dbapi
from papermerge.core import utils
from papermerge.core.features import auth
from papermerge.core.features.auth import scopes
from papermerge.core.tasks import delete_user_data
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.db.engine import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

logger = logging.getLogger(__name__)


@router.get("/group-homes")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
async def get_user_group_homes(
    user: Annotated[
        schema.User, Security(auth.get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> list[schema.UserHome]:
    """Get all user group homes

    Required scope: `{scope}`
    """
    result, error = await dbapi.get_user_group_homes(db_session, user_id=user.id)

    if error:
        raise HTTPException(status_code=400, detail=error)

    return result


@router.get("/group-inboxes")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
async def get_user_group_homes(
    user: Annotated[
        schema.User, Security(auth.get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.UserInbox]:
    """Get all user group inboxes

    Required scope: `{scope}`
    """
    result, error = await dbapi.get_user_group_inboxes(db_session, user_id=user.id)

    if error:
        raise HTTPException(status_code=400, detail=error)

    return result


@router.get("/me")
@utils.docstring_parameter(scope=scopes.USER_ME)
async def get_current_user(
    user: Annotated[
        schema.User, Security(auth.get_current_user, scopes=[scopes.USER_ME])
    ],
) -> schema.User:
    """Returns current user

    Required scope: `{scope}`
    """
    logger.debug(f"User {user} found")
    return schema.User.model_validate(user)


@router.get("/")
@utils.docstring_parameter(scope=scopes.USER_VIEW)
async def get_users(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.USER_VIEW])],
    params: CommonQueryParams = Depends(),
    db_session: AsyncSession=Depends(get_db),
) -> schema.PaginatedResponse[schema.User]:
    """Get all users

    Required scope: `{scope}`
    """

    paginated_users = await dbapi.get_users(
        db_session, page_size=params.page_size, page_number=params.page_number
    )

    return paginated_users


@router.get("/all", response_model=list[schema.User])
@utils.docstring_parameter(scope=scopes.USER_SELECT)
async def get_users_without_pagination(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.USER_SELECT])
    ],
    db_session: AsyncSession=Depends(get_db),
):
    """Get all users without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    result = await dbapi.get_users_without_pagination(db_session)

    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.USER_CREATE)
async def create_user(
    pyuser: schema.CreateUser,
    cur_user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.USER_CREATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.User:
    """Creates user

    Required scope: `{scope}`
    """
    user, error = await dbapi.create_user(
        db_session,
        username=pyuser.username,
        email=pyuser.email,
        password=pyuser.password,
        role_ids=pyuser.role_ids,
        is_active=pyuser.is_active,
        is_superuser=pyuser.is_superuser,
        group_ids=pyuser.group_ids,
    )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return user


@router.get(
    "/{user_id}",
    status_code=200,
    responses={
        404: {
            "description": """No user with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
    response_model=schema.UserDetails,
)
@utils.docstring_parameter(scope=scopes.USER_VIEW)
async def get_user_details(
    user_id: UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.USER_VIEW])],
    db_session: AsyncSession  =Depends(get_db),
):
    """Get user details

    Required scope: `{scope}`
    """
    user, error = await dbapi.get_user_details(
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
async def delete_user(
    user_id: UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.USER_DELETE])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> None:
    """Deletes user

    Required scope: `{scope}`
    """
    if await dbapi.get_users_count(db_session) == 1:
        raise HTTPException(
            status_code=432, detail="Deletion not possible. Only one user left."
        )

    try:
        if os.environ.get("PAPERMERGE__REDIS__URL"):
            delete_user_data.apply_async(kwargs={"user_id": str(user_id)})
        else:
            await dbapi.delete_user(db_session, user_id=user_id)
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=469, detail=str(e))


@router.patch("/{user_id}", status_code=200, response_model=schema.UserDetails)
@utils.docstring_parameter(scope=scopes.USER_UPDATE)
async def update_user(
    user_id: UUID,
    attrs: schema.UpdateUser,
    cur_user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.USER_UPDATE])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> schema.UserDetails:
    """Updates user

    Required scope: `{scope}`
    """
    user, error = await dbapi.update_user(db_session, user_id=user_id, attrs=attrs)

    if error:
        raise HTTPException(status_code=404, detail=error.model_dump())

    return user


@router.post(
    "/{user_id}/change-password", status_code=200, response_model=schema.UserDetails
)
@utils.docstring_parameter(scope=scopes.USER_UPDATE)
async def change_user_password(
    user_id: UUID,
    attrs: schema.ChangeUserPassword,
    cur_user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.USER_UPDATE])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> schema.UserDetails:
    """Change user password

    Required scope: `{scope}`
    """
    user, error = await dbapi.change_password(
        db_session, user_id=UUID(attrs.userId), password=attrs.password
    )

    if error:
        raise HTTPException(status_code=469, detail=error.model_dump())

    return user
