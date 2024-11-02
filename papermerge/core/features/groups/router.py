import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound

from papermerge.core import db, utils
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.db.engine import Session
from papermerge.core.features.groups.db import api as dbapi
from papermerge.core.features.groups.schema import (
    CreateGroup,
    Group,
    GroupDetails,
    UpdateGroup,
)
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.paginator import PaginatorGeneric, paginate
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.features.users import schema as users_schema

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)

logger = logging.getLogger(__name__)


@router.get("/all", response_model=list[Group])
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_groups_without_pagination(
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
):
    """Get all groups without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    with Session() as db_session:
        result = dbapi.get_groups(db_session)

    return result


@router.get("/", response_model=PaginatorGeneric[Group])
@paginate
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_groups(
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
    params: CommonQueryParams = Depends(),
):
    """Get all (paginated) groups

    Required scope: `{scope}`
    """
    with Session() as db_session:
        result = dbapi.get_groups(db_session)

    return result


@router.get("/{group_id}", response_model=GroupDetails)
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_group(
    group_id: int,
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
):
    """Get group details

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            result = dbapi.get_group(db_session, group_id=group_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Group not found")

    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.GROUP_CREATE)
def create_group(
    pygroup: CreateGroup,
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.GROUP_CREATE])
    ],
) -> Group:
    """Creates group

    Required scope: `{scope}`
    """
    with Session() as db_session:
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
        users_schema.User, Security(get_current_user, scopes=[scopes.GROUP_DELETE])
    ],
) -> None:
    """Deletes group

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            dbapi.delete_group(db_session, group_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Group not found")


@router.patch("/{group_id}", status_code=200, response_model=Group)
@utils.docstring_parameter(scope=scopes.GROUP_UPDATE)
def update_group(
    group_id: int,
    attrs: UpdateGroup,
    cur_user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.GROUP_UPDATE])
    ],
    db_session: db.Session = Depends(db.get_session),
) -> Group:
    """Updates group

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            group: Group = dbapi.update_group(
                db_session, group_id=group_id, attrs=attrs
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Group not found")

    return group
