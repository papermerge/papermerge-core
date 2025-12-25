import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security, Query, Path, \
    Body
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import utils, schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.db.engine import get_db
from papermerge.core.schemas.error import ErrorResponse
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext
from .schema import RoleParams

router = APIRouter(
    prefix="/roles",
    tags=["roles"],
)

logger = logging.getLogger(__name__)


@router.get("/all")
@utils.docstring_parameter(scope=scopes.ROLE_SELECT)
async def get_roles_without_pagination(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_SELECT])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.Role]:
    """Get all roles without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    result = await dbapi.get_roles_without_pagination(db_session)

    return result


@router.get("/scopes/all")
@utils.docstring_parameter(scope=scopes.ROLE_SELECT)
async def get_scopes_all(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_SELECT])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> list[str]:
    """Get all available scopes without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    return sorted(scopes.Scopes().all_scopes())


@router.get("/", response_model=schema.PaginatedResponse[schema.RoleEx])
@utils.docstring_parameter(scope=scopes.ROLE_VIEW)
async def get_roles(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.ROLE_VIEW])],
    params: RoleParams = Depends(),
    db_session: AsyncSession = Depends(get_db),
) -> schema.PaginatedResponse[schema.RoleEx]:
    """Get all (paginated) roles

    Required scope: `{scope}`
    """
    try:
        filters = params.to_filters()
        result = await dbapi.get_roles(
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
            f"Error fetching roles by the user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")


    return result


@router.get("/{role_id}", response_model=schema.RoleDetails)
@utils.docstring_parameter(scope=scopes.ROLE_VIEW)
async def get_role(
    role_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.ROLE_VIEW])],
    db_session: AsyncSession = Depends(get_db),
):
    """Get role details

    Required scope: `{scope}`
    """
    try:
        result = await dbapi.get_role(db_session, role_id=role_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Role not found")

    return result


@router.post(
    "/", status_code=201,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid permission scopes"},
        409: {"model": ErrorResponse, "description": "Role already exists"},
        422: {"model": ErrorResponse, "description": "Role name is empty"},
        500: {"model": ErrorResponse, "description": "System configuration error or server error"}
    }
)
@utils.docstring_parameter(scope=scopes.ROLE_CREATE)
async def create_role(
    pyrole: schema.CreateRole,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_CREATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Role:
    """Creates role

    Required scope: `{scope}`

    **Error Cases:**
    - **400**: Invalid permission scopes provided
    - **409**: Role with the same name already exists
    - **422**: Role name is empty or contains only whitespace
    - **500**: System configuration error or unexpected server error
    """
    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
        role, error = await dbapi.create_role(
            db_session,
            name=pyrole.name,
            scopes=pyrole.scopes,
            created_by=user.id
        )
    if error:
        if "already exists" in error.lower():
            raise HTTPException(
                status_code=409,  # Conflict
                detail=f"Role '{pyrole.name}' already exists"
            )
        elif "unknown permission" in error.lower():
            raise HTTPException(
                status_code=400,  # Bad Request
                detail=error
            )
        elif "no permissions in the system" in error.lower():
            raise HTTPException(
                status_code=500,  # Internal Server Error
                detail="System configuration error: No permissions available"
            )
        elif "cannot be empty" in error.lower() or "name_not_empty" in error.lower():
            raise HTTPException(
                status_code=422,  # Unprocessable Entity
                detail="Role name cannot be empty"
            )
        else:
            # Generic server error for unexpected cases
            raise HTTPException(
                status_code=500,
                detail="Failed to create role"
            )
    return role


@router.delete(
    "/{role_id}",
    status_code=204,
    responses={
        404: {
            "description": """No role with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        400: {
            "description": """Role has active user associations""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.ROLE_DELETE)
async def delete_role(
    role_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_DELETE])
    ],
    force: bool = Query(False, description="Force delete even if role has active user associations"),
    db_session: AsyncSession = Depends(get_db),
) -> None:
    """Deletes role (soft delete)

    Soft deletes the role and removes all user associations.
    Users will immediately lose permissions granted by this role.
    Use ?force=true to delete roles with active user associations.

    Required scope: `{scope}`
    """
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            await dbapi.delete_role(db_session, role_id, user.id, force_delete=force)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Role not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch(
    "/{role_id}/archive",
    status_code=204,
    responses={
        404: {
            "description": """No role with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.ROLE_UPDATE)
async def archive_role(
    role_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_UPDATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> None:
    """Archives role

    Archives the role, making it inactive for new assignments while preserving
    existing user permissions. Archived roles are hidden from role selection
    but users retain their current permissions.

    Required scope: `{scope}`
    """
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            await dbapi.archive_role(db_session, role_id, user.id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Role not found")


@router.patch(
    "/{role_id}/restore",
    status_code=204,
    responses={
        404: {
            "description": """No role with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        400: {
            "description": """Role is not deleted""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.ROLE_UPDATE)
async def restore_role(
    role_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_UPDATE])
    ],
    restore_user_associations: bool = Query(
        True,
        description="Whether to restore user associations along with the role"
    ),
    db_session: AsyncSession = Depends(get_db),
) -> None:
    """Restores a deleted role

    Restores a soft-deleted role back to active status. Optionally restores
    user associations that were deleted when the role was deleted.
    Also unarchives the role if it was archived.

    Required scope: `{scope}`
    """
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            await dbapi.restore_role(db_session, role_id, user.id, restore_user_associations)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Role not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch(
    "/{role_id}",
    status_code=200,
    response_model=schema.RoleDetails,
    responses={
        400: {
            "description": "Bad Request - Invalid permissions or request data",
            "content": {"application/json": {}}
        },
        401: {
            "description": "Unauthorized - Authentication required",
            "content": {
                "application/json": {}
            }
        },
        403: {
            "description": "Forbidden - Insufficient permissions",
            "content": {"application/json": {}}
        },
        404: {
            "description": "Not Found - Role does not exist",
            "content": {"application/json": {}}
        },
        409: {
            "description": "Conflict - Role name already exists",
            "content": {"application/json": {}}
        },
        422: {
            "description": "Unprocessable Entity - Request validation failed",
            "content": {
                "application/json": {}
            }
        }
    }
)
@utils.docstring_parameter(scope=scopes.ROLE_UPDATE)
async def update_role(
    role_id: Annotated[
        uuid.UUID,
        Path(description="The unique identifier of the role to update")
    ],
    attrs: Annotated[
        schema.UpdateRole,
        Body(description="Role update data containing name and permissions")
    ],
    cur_user: Annotated[
        schema.User,
        Security(
            get_current_user,
            scopes=[scopes.ROLE_UPDATE]
        )
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.RoleDetails:
    """Updates an existing role with new name and permissions.

    This endpoint allows updating a role's name and associated permissions.
    The role is identified by its UUID and will be updated with the provided
    attributes. All changes are audited and tracked.

    **Required scope:** `{scope}`

    **Validation Rules:**
    - Role name cannot be empty or whitespace-only
    - Role name must be unique among active (non-deleted) roles
    - All specified permission scopes must exist in the system
    - Role must exist and not be soft-deleted
    """
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=cur_user.id,
            username=cur_user.username
        ):
            role = await dbapi.update_role(
                db_session, role_id=role_id, attrs=attrs
            )
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(status_code=404, detail="Role not found")
        elif "already exists" in error_msg:
            raise HTTPException(status_code=409, detail=error_msg)
        elif "Permissions not found" in error_msg:
            raise HTTPException(status_code=400, detail=error_msg)
        else:
            raise HTTPException(status_code=400, detail="Invalid request")

    return role
