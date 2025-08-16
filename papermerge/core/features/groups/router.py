import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core import utils, schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.groups.db import api as dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.db.engine import get_db

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)

logger = logging.getLogger(__name__)


@router.get("/all")
@utils.docstring_parameter(scope=scopes.GROUP_SELECT)
async def get_groups_without_pagination(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_SELECT])
    ],
    db_session: AsyncSession=Depends(get_db),
) -> list[schema.Group]:
    """Get all groups without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    result = await dbapi.get_groups_without_pagination(db_session)

    return result


@router.get("/")
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
async def get_groups(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
    params: CommonQueryParams = Depends(),
    db_session: AsyncSession=Depends(get_db),
):
    """Get all (paginated) groups

    Required scope: `{scope}`
    """
    result = await dbapi.get_groups(
        db_session, page_size=params.page_size, page_number=params.page_number
    )

    return result


@router.get("/{group_id}", response_model=schema.GroupDetails)
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
async def get_group(
    group_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
    db_session: AsyncSession = Depends(get_db),
):
    """Get group details

    Required scope: `{scope}`
    """
    try:
        result = await dbapi.get_group(db_session, group_id=group_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Group not found")

    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.GROUP_CREATE)
async def create_group(
    pygroup: schema.CreateGroup,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_CREATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Group:
    """Creates group

    Required scope: `{scope}`
    """
    try:
        group = await dbapi.create_group(
            db_session,
            name=pygroup.name,
            with_special_folders=pygroup.with_special_folders
        )
    except Exception as e:
        error_msg = str(e)
        if "UNIQUE constraint failed" in error_msg:
            raise HTTPException(status_code=400, detail="Group already exists")
        raise HTTPException(status_code=400, detail=error_msg)

    return group


@router.delete(
    "/{group_id}",
    status_code=204,
    responses={
        404: {
            "description": """No group with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.GROUP_DELETE)
async def delete_group(
    group_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_DELETE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> None:
    """Deletes group

    Required scope: `{scope}`
    """
    try:
        await dbapi.delete_group(db_session, group_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Group not found")


@router.patch("/{group_id}", status_code=200, response_model=schema.Group)
@utils.docstring_parameter(scope=scopes.GROUP_UPDATE)
async def update_group(
    group_id: uuid.UUID,
    attrs: schema.UpdateGroup,
    cur_user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_UPDATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Group:
    """Updates group

    `with_special_folders` flag expresses user intention regarding special folders:
    does he/she want to keep, or create, special folders of this group
    or he/she intends to remove them. Special folders clean up is performed
    as background task.

    `with_special_folders` flag behaviour is as follows:

    There two cases:

    Case 1: group does NOT have special folders (home and inbox).
        In such case, if `with_special_folders` is True, then special folders for this group
        will be created.
        If `with_special_folders` is False, then nothing with happen in
        respect to special folders.

    Case 2: group does have special folders.
        In such case, if `with_special_folders` is True, then nothing
        will happen in respect to special folders.
        If `with_special_folders` is False, then database field
        `group.delete_special_folders` will be set to True to indicate
         to user that deletion of special folder is desired. Background task
        will be scheduled to delete special folders. Note that
        it is background task to set `home_folder_id` and `inbox_folder_id` to
        NULL. In other words, it may take a while until group's special folders
        are cleanup and set to NULL.

    Required scope: `{scope}`
    """
    try:
        group: schema.Group = await dbapi.update_group(
            db_session, group_id=group_id, attrs=attrs
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Group not found")

    return group
