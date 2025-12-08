import logging
import uuid

from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.exc import IntegrityError, NoResultFound

from papermerge.core.db.exceptions import ResourceAccessDenied
from papermerge.core import schema, scopes, db
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.custom_fields.db import api as dbapi
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.features.users.db import api as user_dbapi
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext
from papermerge.core.types import ResourceType, OwnerType, Owner
from .schema import CustomFieldParams

router = APIRouter(
    prefix="/custom-fields",
    tags=["custom-fields"],
)

logger = logging.getLogger(__name__)


@router.get(
    "/all",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": "User does not belong to group",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def get_custom_fields_without_pagination(
    user: scopes.ViewCustomFields,
    db_session: db.DBRouterAsyncSession,
    group_id: uuid.UUID | None = None,
    document_type_id: uuid.UUID | None = None,
) -> list[cf_schema.CustomField]:
    """Get all custom fields without pagination

    If non-empty `group_id` parameter is supplied it will
    return all custom fields belonging to this group if and only if current
    user belongs to this group.
    If non-empty `group_id` parameter is provided and current
    user does not belong to this group - http status code 403 (Forbidden) will
    be raised.
    If `group_id` parameter is not provided (empty) then
    will return all custom fields of the current user.
    """
    owner_id = group_id or user.id
    owner_type = OwnerType.USER
    if group_id:
        owner_type = OwnerType.GROUP

    owner=Owner(owner_id=owner_id, owner_type=owner_type)

    if group_id:
        ok = await user_dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group_id)
        if not ok:
            detail = f"User {user.id=} does not belong to group {group_id=}"
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

    result = await dbapi.get_custom_fields_without_pagination(
        db_session, owner=owner, document_type_id=document_type_id
    )

    return result


@router.get("/")
async def get_custom_fields(
    user: scopes.ViewCustomFields,
    db_session: db.DBRouterAsyncSession,
    # Without = Depends(), FastAPI interprets
    # params: CustomFieldParams as a request body (JSON), not query parameters.
    params: CustomFieldParams = Depends(),
) -> schema.PaginatedResponse[schema.CustomFieldEx]:
    """Get paginated list of custom fields"""
    try:
        filters = params.to_filters()
        result = await dbapi.get_custom_fields(
            db_session,
            user_id=user.id,
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
            f"Error fetching group by the user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")


    return result


@router.get("/{custom_field_id}")
async def get_custom_field(
    custom_field_id: uuid.UUID,
    db_session: db.DBRouterAsyncSession,
    user: scopes.ViewCustomFields,
) -> cf_schema.CustomFieldDetails:
    """Get custom field"""
    has_access = await ownership_api.user_can_access_resource(
        session=db_session,
        user_id=user.id,
        resource_type=ResourceType.CUSTOM_FIELD,
        resource_id=custom_field_id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Use 404 to not leak existence
            detail=f"{ResourceType.CUSTOM_FIELD.value.replace('_', ' ').title()} not found"
        )

    try:
        result = await dbapi.get_custom_field(
            db_session,
            custom_field_id=custom_field_id
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Custom field not found")
    except ResourceAccessDenied:
        raise HTTPException(status_code=403, detail="Forbidden: You don't have permission to access this custom field")

    return result


@router.post(
    "/",
    status_code=201,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": """User does not belong to group""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def create_custom_field(
    data: schema.CreateCustomField,
    user: scopes.CreateCustomFields,
    db_session: db.DBRouterAsyncSession,
) -> cf_schema.CustomField:
    """Create a new custom field"""
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            ret = await dbapi.create_custom_field(
                db_session,
                data=data
            )
    except ValueError as e:
        await db_session.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return ret


@router.delete(
    "/{custom_field_id}",
    status_code=204,
    responses={
        404: {
            "description": """No custom field with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        403: {
            "description": """Forbidden: You don't have permission to delete this custom field""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def delete_custom_field(
    custom_field_id: uuid.UUID,
    user:  scopes.DeleteCustomFields,
    db_session: db.DBRouterAsyncSession,
) -> None:
    """Deletes custom field"""

    has_access = await ownership_api.user_can_access_resource(
        session=db_session,
        user_id=user.id,
        resource_type=ResourceType.CUSTOM_FIELD,
        resource_id=custom_field_id
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Use 404 to not leak existence
            detail=f"{ResourceType.CUSTOM_FIELD.value.replace('_', ' ').title()} not found"
        )

    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            await dbapi.delete_custom_field(
                db_session,
                user_id=user.id,  # Add user_id for access control
                custom_field_id=custom_field_id
            )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Custom field not found")
    except ResourceAccessDenied:  # Add this import
        raise HTTPException(status_code=403, detail="Forbidden: You don't have permission to delete this custom field")


@router.patch(
    "/{custom_field_id}",
    status_code=200,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": """User does not belong to group""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
async def update_custom_field(
    custom_field_id: uuid.UUID,
    data: schema.UpdateCustomField,
    cur_user: scopes.UpdateCustomFields,
    db_session: db.DBRouterAsyncSession,
) -> cf_schema.CustomField:
    """Updates custom field"""
    has_access = await ownership_api.user_can_access_resource(
        session=db_session,
        user_id=cur_user.id,
        resource_type=ResourceType.CUSTOM_FIELD,
        resource_id=custom_field_id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Use 404 to not leak existence
            detail=f"{ResourceType.CUSTOM_FIELD.value.replace('_', ' ').title()} not found"
        )

    try:
        async with AsyncAuditContext(
            db_session,
            user_id=cur_user.id,
            username=cur_user.username
        ):
            cfield: cf_schema.CustomField = await dbapi.update_custom_field(
                db_session, field_id=custom_field_id, data=data
            )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Not found")

    return cfield


@router.get("/{custom_field_id}/usage-counts")
async def get_option_usage_counts(
    custom_field_id: uuid.UUID,
    db_session: db.DBRouterAsyncSession,
    user: scopes.ViewCustomFields,
    # Query(...) means "required, no default value"
    option_values: list[str] = Query(..., min_length=1),
) -> dict[str, int]:
    """
    Get document counts for option values of a select/multiselect field.

    It basically counts how many documents reference given value of
    select/multiselect option.
    Here select/multiselect means custom field of type select/multiselect.
    """
    has_access = await ownership_api.user_can_access_resource(
        session=db_session,
        user_id=user.id,
        resource_type=ResourceType.CUSTOM_FIELD,
        resource_id=custom_field_id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Use 404 to not leak existence
            detail=f"{ResourceType.CUSTOM_FIELD.value.replace('_', ' ').title()} not found"
        )

    try:
        result = await dbapi.get_option_usage_counts(
            db_session,
            user_id=user.id,
            field_id=custom_field_id,
            option_values=option_values
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result
