import os
import logging
from uuid import UUID
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from papermerge.core.features.auth import get_current_user, scopes
from papermerge.core.features.auth.dependencies import require_scopes
from papermerge.core import schema, dbapi, orm
from papermerge.core.tasks import delete_user_data
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.db.engine import get_db
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext
from .schema import UserParams

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

logger = logging.getLogger(__name__)


@router.get("/group-homes")
async def get_user_group_homes(
    user: require_scopes(scopes.NODE_VIEW),
    db_session: AsyncSession=Depends(get_db),
) -> list[schema.UserHome]:
    """Get all user group homes"""
    result, error = await dbapi.get_user_group_homes(db_session, user_id=user.id)

    if error:
        raise HTTPException(status_code=400, detail=error)

    return result


@router.get("/group-inboxes")
async def get_user_group_homes(
    user: require_scopes(scopes.NODE_VIEW),
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.UserInbox]:
    """Get all user group inboxes"""
    result, error = await dbapi.get_user_group_inboxes(db_session, user_id=user.id)

    if error:
        raise HTTPException(status_code=400, detail=error)

    return result


@router.get("/me")
async def get_current_user(
    user: Annotated[schema.User, Depends(get_current_user)],
) -> schema.User:
    """Returns current user"""
    return user


@router.get("/")
async def get_users(
    user: require_scopes(scopes.USER_VIEW),
    params: UserParams = Depends(),
    db_session: AsyncSession=Depends(get_db),
) -> schema.PaginatedResponse[schema.UserEx]:
    """Get all users"""

    try:
        filters = params.to_filters()
        paginated_users = await dbapi.get_users(
            db_session,
            page_size=params.page_size,
            page_number=params.page_number,
            sort_by=params.sort_by,
            sort_direction=params.sort_direction,
            filters=filters
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        logger.error(
            f"Error fetching users by the user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")


    return paginated_users


@router.get("/all", response_model=list[schema.User])
async def get_users_without_pagination(
    user: require_scopes(scopes.USER_SELECT),
    db_session: AsyncSession=Depends(get_db),
):
    """Get all users without pagination/filtering/sorting"""
    result = await dbapi.get_users_without_pagination(db_session)

    return result


@router.post(
    "/",
    status_code=201,
    responses={
        400: {"description": "Invalid parameters or validation error"},
        404: {"description": "Specified roles or groups not found"},
        409: {"description": "User with username or email already exists"},
        500: {"description": "Internal server error"}
    }
)
async def create_user(
    pyuser: schema.CreateUser,
    cur_user: require_scopes(scopes.USER_CREATE),
    db_session: AsyncSession = Depends(get_db),
) -> schema.User:
    """Creates user"""

    if pyuser.role_ids:
        # Validate roles exist and are active
        roles_result = await db_session.execute(
            select(orm.Role.id).where(
                orm.Role.id.in_(pyuser.role_ids),
                orm.Role.deleted_at.is_(None)
            )
        )
        found_role_ids = set(roles_result.scalars().all())
        missing_roles = set(pyuser.role_ids) - found_role_ids
        if missing_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid or inactive role IDs: {missing_roles}"
            )
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=cur_user.id,
            username=cur_user.username
        ):
            db_user = await dbapi.create_user(
                db_session,
                username=pyuser.username,
                email=pyuser.email,
                password=pyuser.password,
                role_ids=pyuser.role_ids,
                is_active=pyuser.is_active,
                is_superuser=pyuser.is_superuser,
                group_ids=pyuser.group_ids,
            )
    except IntegrityError as e:
        await db_session.rollback()
        error_msg = str(e).lower()
        if "username" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="A user with this username already exists"
            )
        elif "email" in error_msg:
            raise HTTPException(
                status_code=409,
                detail="A user with this email already exists"
            )
        else:
            logger.error(f"IntegrityError creating user by {cur_user.username}: {e}", exc_info=True)
            raise HTTPException(status_code=409, detail="User already exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        logger.error(
            f"Error creating user {cur_user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

    return db_user


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
async def get_user_details(
    user_id: UUID,
    user: require_scopes(scopes.USER_VIEW),
    db_session: AsyncSession  =Depends(get_db),
):
    """Get user details"""
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
async def delete_user(
    user_id: UUID,
    cur_user: require_scopes(scopes.USER_DELETE),
    db_session: AsyncSession=Depends(get_db),
) -> None:
    """Deletes user"""

    if await dbapi.get_users_count(db_session) == 1:
        raise HTTPException(
            status_code=432, detail="Deletion not possible. Only one user left."
        )

    try:
        if os.environ.get("PAPERMERGE__REDIS__URL"):
            delete_user_data.apply_async(kwargs={"user_id": str(user_id)})
        else:
            async with AsyncAuditContext(
                db_session,
                user_id=cur_user.id,
                username=cur_user.username
            ):
                await dbapi.delete_user(
                    db_session,
                    user_id=user_id,
                    deleted_by_user_id=cur_user.id
                )
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=469, detail=str(e))


@router.patch("/{user_id}", status_code=200, response_model=schema.UserDetails)
async def update_user(
    user_id: UUID,
    attrs: schema.UpdateUser,
    cur_user: require_scopes(scopes.USER_UPDATE),
    db_session: AsyncSession=Depends(get_db),
) -> schema.UserDetails:
    """Updates user"""

    async with AsyncAuditContext(
        db_session,
        user_id=cur_user.id,
        username=cur_user.username
    ):
        user, error = await dbapi.update_user(db_session, user_id=user_id, attrs=attrs)

    if error:
        raise HTTPException(status_code=404, detail=error.model_dump())

    return user


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    response_model=schema.UserDetails
)
async def change_user_password(
    attrs: schema.ChangeUserPassword,
    cur_user: require_scopes(scopes.USER_UPDATE),
    db_session: AsyncSession = Depends(get_db),
) -> schema.UserDetails:
    """Change user password"""
    async with AsyncAuditContext(
        db_session,
        user_id=cur_user.id,
        username=cur_user.username
    ):
        user, error = await dbapi.change_password(
            db_session,
            user_id=UUID(attrs.userId),
            password=attrs.password
        )

    if error:
        if "not found" in str(error.messages).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error.model_dump()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error.model_dump()
            )

    return user
