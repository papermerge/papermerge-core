import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound

from papermerge.core import utils, db, schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.groups.db import api as dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.params import CommonQueryParams

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)

logger = logging.getLogger(__name__)


@router.get("/all")
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_groups_without_pagination(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
) -> list[schema.Group]:
    """Get all groups without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        result = dbapi.get_groups_without_pagination(db_session)

    return result


@router.get("/")
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_groups(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
    params: CommonQueryParams = Depends(),
):
    """Get all (paginated) groups

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        result = dbapi.get_groups(
            db_session, page_size=params.page_size, page_number=params.page_number
        )

    return result


@router.get("/{group_id}", response_model=schema.GroupDetails)
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_group(
    group_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
):
    """Get group details

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        try:
            result = dbapi.get_group(db_session, group_id=group_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Group not found")

    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.GROUP_CREATE)
def create_group(
    pygroup: schema.CreateGroup,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_CREATE])
    ],
) -> schema.Group:
    """Creates group

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        try:
            group = dbapi.create_group(
                db_session,
                name=pygroup.name,
                scopes=pygroup.scopes,
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
def delete_group(
    group_id: int,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_DELETE])
    ],
) -> None:
    """Deletes group

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        try:
            dbapi.delete_group(db_session, group_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Group not found")


@router.patch("/{group_id}", status_code=200, response_model=schema.Group)
@utils.docstring_parameter(scope=scopes.GROUP_UPDATE)
def update_group(
    group_id: uuid.UUID,
    attrs: schema.UpdateGroup,
    cur_user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.GROUP_UPDATE])
    ],
) -> schema.Group:
    """Updates group

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        try:
            group: schema.Group = dbapi.update_group(
                db_session, group_id=group_id, attrs=attrs
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Group not found")

    return group
