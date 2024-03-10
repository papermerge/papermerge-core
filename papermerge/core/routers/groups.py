import logging
from typing import Annotated
from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Security

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
        432: {
            "description": """Deletion is not possible because there is only
             one user left""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        },
        404: {
            "description": """No user with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        }
    }
)
@utils.docstring_parameter(scope=scopes.GROUP_DELETE)
def delete_group(
    group_id: UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.GROUP_DELETE])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> None:
    """Deletes user

    Required scope: `{scope}`
    """
    db.delete_group(engine, group_id)


@router.patch("/{groups_id}", status_code=200)
@utils.docstring_parameter(scope=scopes.GROUP_UPDATE)
def update_group(
    group_id: UUID,
    update_group: schemas.UpdateGroup,
    cur_user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.GROUP_UPDATE])
    ],
    engine: db.Engine = Depends(db.get_engine)
) -> schemas.Group:
    """Updates user

    Required scope: `{scope}`
    """

    db.update_group(
        engine,
        id=group_id,
        group=update_group
    )
