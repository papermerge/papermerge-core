import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import IntegrityError, NoResultFound

from papermerge.core import utils
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.db.engine import Session
from papermerge.core.features.custom_fields import schema as cf_schema
from papermerge.core.features.custom_fields.db import api as dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.features.users.schema import User

from .types import PaginatedQueryParams

router = APIRouter(
    prefix="/custom-fields",
    tags=["custom-fields"],
)

logger = logging.getLogger(__name__)


@router.get("/all", response_model=list[cf_schema.CustomField])
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_VIEW)
def get_custom_fields_without_pagination(
    user: Annotated[
        User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_VIEW])
    ],
):
    """Get all custom fields without pagination/filtering/sorting

    Required scope: `{scope}`
    """
    with Session() as db_session:
        result = dbapi.get_custom_fields_without_pagination(db_session, user_id=user.id)

    return result


@router.get("/")
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_VIEW)
def get_custom_fields(
    user: Annotated[
        User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_VIEW])
    ],
    params: PaginatedQueryParams = Depends(),
):
    """Get paginated list of custom fields

    Required scope: `{scope}`
    """
    with Session() as db_session:
        result = dbapi.get_custom_fields(
            db_session,
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            order_by=params.order_by,
            filter=params.filter,
        )

    return result


@router.get("/{custom_field_id}", response_model=cf_schema.CustomField)
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_VIEW)
def get_custom_field(
    custom_field_id: uuid.UUID,
    user: Annotated[
        User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_VIEW])
    ],
):
    """Get custom field

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            result = dbapi.get_custom_field(db_session, custom_field_id=custom_field_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Custom field not found")

    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_CREATE)
def create_custom_field(
    cfield: cf_schema.CreateCustomField,
    user: Annotated[
        User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_CREATE])
    ],
) -> cf_schema.CustomField:
    """Creates custom field

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            custom_field = dbapi.create_custom_field(
                db_session,
                name=cfield.name,
                type=cfield.type,
                extra_data=cfield.extra_data,
                user_id=user.id,
            )
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Duplicate custom field name")

    return custom_field


@router.delete(
    "/{custom_field_id}",
    status_code=204,
    responses={
        404: {
            "description": """No custom field with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_DELETE)
def delete_custom_field(
    custom_field_id: uuid.UUID,
    user: Annotated[
        User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_DELETE])
    ],
) -> None:
    """Deletes custom field

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            dbapi.delete_custom_field(db_session, custom_field_id)
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Custom field not found")


@router.patch(
    "/{custom_field_id}", status_code=200, response_model=cf_schema.CustomField
)
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_UPDATE)
def update_custom_field(
    custom_field_id: uuid.UUID,
    attrs: cf_schema.UpdateCustomField,
    cur_user: Annotated[User, Security(get_current_user, scopes=[scopes.GROUP_UPDATE])],
) -> cf_schema.CustomField:
    """Updates custom field

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            cfield: cf_schema.CustomField = dbapi.update_custom_field(
                db_session, custom_field_id=custom_field_id, attrs=attrs
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Group not found")

    return cfield
