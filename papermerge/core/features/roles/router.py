import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound

from papermerge.core import utils, db, schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.roles.db import api as dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.params import CommonQueryParams

router = APIRouter(
    prefix="/roles",
    tags=["roles"],
)

logger = logging.getLogger(__name__)


@router.get("/all")
@utils.docstring_parameter(scope=scopes.ROLE_VIEW)
def get_roles_without_pagination(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.ROLE_VIEW])],
) -> list[schema.Role]:
    """Get all roles without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        result = dbapi.get_roles_without_pagination(db_session)

    return result


@router.get("/")
@utils.docstring_parameter(scope=scopes.ROLE_VIEW)
def get_roles(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.ROLE_VIEW])],
    params: CommonQueryParams = Depends(),
):
    """Get all (paginated) roles

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        result = dbapi.get_roles(
            db_session, page_size=params.page_size, page_number=params.page_number
        )

    return result


@router.get("/{role_id}", response_model=schema.RoleDetails)
@utils.docstring_parameter(scope=scopes.ROLE_VIEW)
def get_role(
    role_id: uuid.UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.ROLE_VIEW])],
):
    """Get role details

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        try:
            result = dbapi.get_role(db_session, role_id=role_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Role not found")

    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.ROLE_CREATE)
def create_role(
    pyrole: schema.CreateRole,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_CREATE])
    ],
) -> schema.Role:
    """Creates role

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        role, error = dbapi.create_role(
            db_session,
            name=pyrole.name,
            scopes=pyrole.scopes,
        )
        if error:
            raise HTTPException(status_code=500, detail=error)

    return role


@router.delete(
    "/{role_id}",
    status_code=204,
    responses={
        404: {
            "description": """No role with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.ROLE_DELETE)
def delete_role(
    role_id: uuid.UUID,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_DELETE])
    ],
) -> None:
    """Deletes role

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        try:
            dbapi.delete_role(db_session, role_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Role not found")


@router.patch("/{role_id}", status_code=200, response_model=schema.Role)
@utils.docstring_parameter(scope=scopes.ROLE_UPDATE)
def update_role(
    role_id: uuid.UUID,
    attrs: schema.UpdateRole,
    cur_user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.ROLE_UPDATE])
    ],
) -> schema.Role:
    """Updates role

    Required scope: `{scope}`
    """
    with db.Session() as db_session:
        try:
            role: schema.Role = dbapi.update_role(
                db_session, role_id=role_id, attrs=attrs
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Role not found")

    return role
