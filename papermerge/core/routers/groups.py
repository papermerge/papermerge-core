import logging
from typing import Annotated

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound

from papermerge.core import db, schemas, utils
from papermerge.core.auth import get_current_user, scopes

from .common import OPEN_API_GENERIC_JSON_DETAIL
from .paginator import PaginatorGeneric, paginate
from .params import CommonQueryParams

router = APIRouter(
    prefix="/groups",
    tags=["groups"],
)

logger = logging.getLogger(__name__)


@router.get("/", response_model=PaginatorGeneric[schemas.Group])
@paginate
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_groups(
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
    params: CommonQueryParams = Depends(),
    engine: db.Engine = Depends(db.get_engine)
):
    """Get all groups

    Required scope: `{scope}`
    """

    return db.get_groups(engine)


@router.get("/{group_id}", response_model=schemas.GroupDetails)
@utils.docstring_parameter(scope=scopes.GROUP_VIEW)
def get_group(
    group_id: int,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.GROUP_VIEW])
    ],
    engine: db.Engine = Depends(db.get_engine)
):
    """Get group details

    Required scope: `{scope}`
    """
    try:
        result = db.get_group(engine, group_id=group_id)
    except NoResultFound:
        raise HTTPException(
            status_code=404,
            detail="Group not found"
        )
    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.GROUP_CREATE)
def create_group(
    pygroup: schemas.CreateGroup,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.GROUP_CREATE])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.Group:
    """Creates group

    Required scope: `{scope}`
    """
    try:
        group = db.create_group(
            engine,
            name=pygroup.name,
            scopes=pygroup.scopes,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    return group


@router.delete(
    "/{group_id}",
    status_code=204,
    responses={
        404: {
            "description": """No group with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        }
    }
)
@utils.docstring_parameter(scope=scopes.GROUP_DELETE)
def delete_group(
    group_id: int,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.GROUP_DELETE])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> None:
    """Deletes group

    Required scope: `{scope}`
    """
    try:
        db.delete_group(engine, group_id)
    except NoResultFound:
        raise HTTPException(
            status_code=404,
            detail="Group not found"
        )


@router.patch("/{group_id}", status_code=200, response_model=schemas.Group)
@utils.docstring_parameter(scope=scopes.GROUP_UPDATE)
def update_group(
    group_id: int,
    attrs: schemas.UpdateGroup,
    cur_user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.GROUP_UPDATE])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.Group:
    """Updates group

    Required scope: `{scope}`
    """
    try:
        group: schemas.Group = db.update_group(
            engine,
            group_id=group_id,
            attrs=attrs
        )
    except NoResultFound:
        raise HTTPException(
            status_code=404,
            detail="Group not found"
        )

    return group
