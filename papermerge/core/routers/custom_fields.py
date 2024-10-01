import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound

from papermerge.core import db, schemas, utils
from papermerge.core.auth import get_current_user, scopes

from .common import OPEN_API_GENERIC_JSON_DETAIL
from .paginator import PaginatorGeneric, paginate
from .params import CommonQueryParams

router = APIRouter(
    prefix="/custom-fields",
    tags=["custom-fields"],
)

logger = logging.getLogger(__name__)


@router.get("/all", response_model=list[schemas.CustomField])
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_VIEW)
def get_custom_fields_without_pagination(
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_VIEW])
    ],
    db_session: db.Session = Depends(db.get_session),
):
    """Get all custom fields without pagination/filtering/sorting

    Required scope: `{scope}`
    """

    return db.get_custom_fields(db_session)


@router.get("/", response_model=PaginatorGeneric[schemas.CustomField])
@paginate
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_VIEW)
def get_custom_fields(
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_VIEW])
    ],
    params: CommonQueryParams = Depends(),
    db_session: db.Session = Depends(db.get_session),
):
    """Get all (paginated) custom fields

    Required scope: `{scope}`
    """

    return db.get_custom_fields(db_session)


@router.get("/{custom_field_id}", response_model=schemas.CustomField)
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_VIEW)
def get_custom_field(
    custom_field_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_VIEW])
    ],
    db_session: db.Session = Depends(db.get_session),
):
    """Get custom field

    Required scope: `{scope}`
    """
    try:
        result = db.get_custom_field(db_session, custom_field_id=custom_field_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Custom field not found")
    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_CREATE)
def create_custom_field(
    cfield: schemas.CreateCustomField,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_CREATE])
    ],
    db_session: db.Session = Depends(db.get_session),
) -> schemas.CustomField:
    """Creates custom field

    Required scope: `{scope}`
    """
    try:
        custom_field = db.create_custom_field(
            db_session,
            name=cfield.name,
            data_type=cfield.data_type,
            extra_data=cfield.extra_data,
        )
    except Exception as e:
        error_msg = str(e)
        if "UNIQUE constraint failed" in error_msg:
            raise HTTPException(status_code=400, detail="Custom field already exists")
        raise HTTPException(status_code=400, detail=error_msg)

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
        schemas.User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_DELETE])
    ],
    db_session: db.Session = Depends(db.get_session),
) -> None:
    """Deletes custom field

    Required scope: `{scope}`
    """
    try:
        db.delete_custom_field(db_session, custom_field_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Custom field not found")


@router.patch("/{custom_field_id}", status_code=200, response_model=schemas.CustomField)
@utils.docstring_parameter(scope=scopes.CUSTOM_FIELD_UPDATE)
def update_custom_field(
    custom_field_id: uuid.UUID,
    attrs: schemas.UpdateCustomField,
    cur_user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.GROUP_UPDATE])
    ],
    db_session: db.Session = Depends(db.get_session),
) -> schemas.CustomField:
    """Updates custom field

    Required scope: `{scope}`
    """
    try:
        cfield: schemas.CustomField = db.update_custom_field(
            db_session, custom_field_id=custom_field_id, attrs=attrs
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Group not found")

    return cfield
