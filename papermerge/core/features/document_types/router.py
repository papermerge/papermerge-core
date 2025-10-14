import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.db.exceptions import ResourceAccessDenied, \
    DependenciesExist, InvalidRequest
from papermerge.core import utils, dbapi, orm, schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.features.users import schema as users_schema
from papermerge.core.features.document_types import schema as dt_schema
from papermerge.core.db.engine import get_db
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import ResourceType
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext
from .schema import DocumentTypeParams, DocumentTypeEx

router = APIRouter(
    prefix="/document-types",
    tags=["document-types"],
)

logger = logging.getLogger(__name__)


@router.get(
    "/all",
    response_model=list[schema.DocumentType],
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": """User does not belong to group""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_VIEW)
async def get_document_types_without_pagination(
    user: Annotated[
        users_schema.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_VIEW]),
    ],
    group_id: uuid.UUID | None = None,
    db_session: AsyncSession = Depends(get_db),
):
    """Get all document types without pagination

    if non-empty `group_id` parameter is supplied it will
    return all document types belonging to this group if and only
    if current user belongs to this group.
    if non-empty `group_id` parameter is provided and current
    user does not belong to this group - http status code 403 (Forbidden) will
    be raised.
    If `group_id` parameter is not provided (empty) then
    will return all document types of the current user.

    Required scope: `{scope}`
    """
    result = await dbapi.get_document_types_without_pagination(
        db_session, user_id=user.id, group_id=group_id
    )

    return result


@router.get(
    "/all-grouped",
    response_model=list[dt_schema.GroupedDocumentType],
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": """User does not belong to group""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_VIEW)
async def get_document_types_without_pagination(
    user: Annotated[
        users_schema.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_VIEW]),
    ],
    db_session: AsyncSession = Depends(get_db),
):
    """Returns all document types to which user has access to, grouped
    by owner. Results are not paginated.

    Required scope: `{scope}`
    """
    result = await dbapi.get_document_types_grouped_by_owner_without_pagination(
        db_session, user_id=user.id
    )

    return result


@router.get("/", response_model=schema.PaginatedResponse[DocumentTypeEx])
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_VIEW)
async def get_document_types(
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_VIEW])
    ],
    params: DocumentTypeParams = Depends(),
    db_session: AsyncSession = Depends(get_db),
) -> schema.PaginatedResponse[DocumentTypeEx]:
    """Get all (paginated) document types

    Required scope: `{scope}`
    """
    try:
        filters = params.to_filters()
        paginated_response = await dbapi.get_document_types(
            db_session,
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            sort_by=params.sort_by,
            sort_direction=params.sort_direction,
            filters=filters,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        logger.error(
            f"Error fetching document type by the user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")


    return paginated_response


@router.get("/{document_type_id}", response_model=schema.DocumentTypeDetails)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_VIEW)
async def get_document_type(
    document_type_id: uuid.UUID,
    user: Annotated[
        users_schema.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_VIEW]),
    ],
    db_session: AsyncSession = Depends(get_db),
):
    """Get document type

    Required scope: `{scope}`
    """
    try:
        result = await dbapi.get_document_type(
            db_session,
            user_id=user.id,
            document_type_id=document_type_id
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document type not found")
    except ResourceAccessDenied:
        raise HTTPException(status_code=403, detail="Forbidden: You don't have permission to access this custom field")

    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_CREATE)
async def create_document_type(
    dtype: schema.CreateDocumentType,
    user: Annotated[
        users_schema.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_CREATE]),
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.DocumentTypeShort:
    """Creates document type

    If attribute `group_id` is present, document type will be owned
    by respective group, otherwise ownership is set to current user.

    Required scope: `{scope}`
    """
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            document_type = await dbapi.create_document_type(db_session, data=dtype)
    except Exception as e:
        error_msg = str(e)
        if "UNIQUE constraint failed" in error_msg:
            raise HTTPException(status_code=400, detail="Document type already exists")
        raise HTTPException(status_code=400, detail=error_msg)

    return schema.DocumentTypeShort.model_validate(document_type)


@router.delete(
    "/{document_type_id}",
    status_code=204,
    responses={
        404: {
            "description": """No document type with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        403: {
            "description": """Forbidden: You don't have permission to delete
            this document type""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        409: {
            "description": """Cannot delete document type because it
            has dependencies like associated custom fields and/or documents.""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_DELETE)
async def delete_document_type(
    document_type_id: uuid.UUID,
    user: Annotated[
        users_schema.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_DELETE]),
    ],
    db_session: AsyncSession = Depends(get_db),
) -> None:
    """Deletes document type

    Required scope: `{scope}`
    """
    try:
        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            await dbapi.delete_document_type(
                db_session,
                user_id=user.id,
                document_type_id=document_type_id
            )
    except NoResultFound:
        raise HTTPException(
            status_code=404,
            detail="Document type not found"
        )
    except ResourceAccessDenied:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You don't have permission to delete this document type"
        )
    except DependenciesExist as e:
        raise HTTPException(
            status_code=409,
            detail=str(e)
        )


@router.patch(
    "/{document_type_id}",
    status_code=200,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": """User does not belong to group""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        400: {
            "description": """Invalid request""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_UPDATE)
async def update_document_type(
    document_type_id: uuid.UUID,
    attrs: schema.UpdateDocumentType,
    cur_user: Annotated[
        users_schema.User,
        Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_UPDATE]),
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.DocumentTypeShort:
    """Updates document type

    Required scope: `{scope}`
    """
    has_access = await ownership_api.user_can_access_resource(
        session=db_session,
        user_id=cur_user.id,
        resource_type=ResourceType.DOCUMENT_TYPE,
        resource_id=document_type_id
    )

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,  # Use 404 to not leak existence
            detail=f"{ResourceType.DOCUMENT_TYPE.value.replace('_', ' ').title()} not found"
        )

    try:
        async with AsyncAuditContext(
            db_session,
            user_id=cur_user.id,
            username=cur_user.username
        ):
            dtype: orm.DocumentType = await dbapi.update_document_type(
                db_session,
                document_type_id=document_type_id,
                attrs=attrs,
            )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document type not found")
    except InvalidRequest as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schema.DocumentTypeShort.model_validate(dtype)
