import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import NoResultFound

from papermerge.core import utils, schema
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.db.engine import get_db
from papermerge.core.features.users.db import api as users_dbapi
from papermerge.core.features.tags.db import api as tags_dbapi
from papermerge.core.features.tags import schema as tags_schema
from papermerge.core.exceptions import EntityNotFound
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext
from papermerge.core.db.exceptions import ResourceAccessDenied
from .schema import TagParams

router = APIRouter(
    prefix="/tags",
    tags=["tags"],
)

logger = logging.getLogger(__name__)


@router.get(
    "/all",
    response_model=list[tags_schema.Tag],
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": "User does not belong to group",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.TAG_SELECT)
async def retrieve_tags_without_pagination(
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_SELECT])
    ],
    group_id: UUID | None = None,
    db_session: AsyncSession = Depends(get_db),
):
    """Get all tags without pagination

    If non-empty `group_id` parameter is supplied it will
    return all tags belonging to this group if and only if current
    user belongs to this group.
    If non-empty `group_id` parameter is provided and current
    user does not belong to this group - http status code 403 (Forbidden) will
    be raised.
    If `group_id` parameter is not provided (empty) then
    will return all tags of the current user.


    Required scope: `{scope}`
    """
    tags = await tags_dbapi.get_tags_without_pagination(
        db_session, user_id=user.id, group_id=group_id
    )

    return tags


@router.get("/", response_model=schema.PaginatedResponse[schema.TagEx])
@utils.docstring_parameter(scope=scopes.TAG_VIEW)
async def get_tags(
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ],
    params: TagParams = Depends(),
    db_session=Depends(get_db),
) -> schema.PaginatedResponse[schema.TagEx]:
    """Retrieves (paginated) list of tags

    Required scope: `{scope}`
    """
    try:
        filters = params.to_filters()
        tags = await tags_dbapi.get_tags(
            db_session,
            user_id=user.id,
            page_number=params.page_number,
            page_size=params.page_size,
            sort_by=params.sort_by,
            sort_direction=params.sort_direction,
            filters=filters
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameters: {str(e)}")
    except Exception as e:
        logger.error(
            f"Error fetching tag by the user {user.id}: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Internal server error")

    return tags


@router.get("/{tag_id}", response_model=tags_schema.TagDetails)
@utils.docstring_parameter(scope=scopes.TAG_VIEW)
async def get_tag_details(
    tag_id: UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_VIEW])
    ],
    db_session: AsyncSession=Depends(get_db),
):
    """Get tag details

    Required scope: `{scope}`
    """
    try:
        result = await tags_dbapi.get_tag(
            db_session,
            user_id=user.id,
            tag_id=tag_id
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Tag not found")
    except ResourceAccessDenied:
        raise HTTPException(status_code=403, detail="Forbidden: You don't have permission to access this tag")

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
@utils.docstring_parameter(scope=scopes.TAG_CREATE)
async def create_tag(
    attrs: tags_schema.CreateTag,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_CREATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> tags_schema.Tag:
    """Creates tag

    If attribute `group_id` is present, tag will be owned
    by respective group, otherwise ownership is set to current user.
    If attribute `group_id` is present then current user should
    belong to that group, otherwise http status 403 (Forbidden) will
    be raised.

    Required scope: `{scope}`
    """
    if not attrs.group_id:
        attrs.user_id = user.id

    if attrs.group_id:
        group_id = attrs.group_id
        ok = await users_dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group_id)
        if not ok:
            detail = f"User {user.id=} does not belong to group {group_id=}"
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
        tag, error = await tags_dbapi.create_tag(db_session, attrs=attrs)

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return tag


@router.delete("/{tag_id}", status_code=204)
@utils.docstring_parameter(scope=scopes.TAG_DELETE)
async def delete_tag(
    tag_id: UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_DELETE])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> None:
    """Deletes user tag

    Required scope: `{scope}`
    """
    try:
        async with AsyncAuditContext(
                db_session,
                user_id=user.id,
                username=user.username
        ):
            await tags_dbapi.delete_tag(db_session, tag_id=tag_id)
    except EntityNotFound:
        raise HTTPException(status_code=404, detail="Does not exists")


@router.patch(
    "/{tag_id}",
    status_code=200,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": """User does not belong to group""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.TAG_UPDATE)
async def update_tag(
    tag_id: UUID,
    attrs: tags_schema.UpdateTag,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.TAG_UPDATE])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> tags_schema.Tag:
    """Updates user tag

    Required scope: `{scope}`
    """
    if attrs.group_id:
        group_id = attrs.group_id
        ok = await users_dbapi.user_belongs_to(db_session, user_id=user.id, group_id=group_id)
        if not ok:
            user_id = user.id
            detail = f"User {user_id=} does not belong to group {group_id=}"
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
    else:
        attrs.user_id = user.id

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
        tag, error = await tags_dbapi.update_tag(db_session, tag_id=tag_id, attrs=attrs)

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return tag
