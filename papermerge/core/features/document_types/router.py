import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.exc import NoResultFound

from papermerge.core import schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.db import Session, get_session
from papermerge.core.features.document_types import db
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.paginator import PaginatorGeneric, paginate
from papermerge.core.routers.params import CommonQueryParams

router = APIRouter(
    prefix="/document-types",
    tags=["document-types"],
)

logger = logging.getLogger(__name__)


@router.get("/all", response_model=list[schemas.DocumentType])
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_VIEW)
def get_document_types_without_pagination(
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_VIEW])
    ],
    db_session: Session = Depends(get_session),
):
    """Get all document types without pagination/filtering/sorting

    Required scope: `{scope}`
    """

    return db.get_document_types(db_session)


@router.get("/", response_model=PaginatorGeneric[schemas.DocumentType])
@paginate
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_VIEW)
def get_document_types(
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.CUSTOM_FIELD_VIEW])
    ],
    params: CommonQueryParams = Depends(),
    db_session: Session = Depends(get_session),
):
    """Get all (paginated) document types

    Required scope: `{scope}`
    """
    return db.get_document_types(db_session)


@router.get("/{document_type_id}", response_model=schemas.DocumentType)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_VIEW)
def get_document_type(
    document_type_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_VIEW])
    ],
    db_session: Session = Depends(get_session),
):
    """Get document type

    Required scope: `{scope}`
    """
    try:
        result = db.get_document_type(db_session, document_type_id=document_type_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document type not found")
    return result


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_CREATE)
def create_document_type(
    dtype: schemas.CreateDocumentType,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_CREATE])
    ],
    db_session: Session = Depends(get_session),
) -> schemas.DocumentType:
    """Creates document type

    Required scope: `{scope}`
    """
    try:
        document_type = db.create_document_type(
            db_session,
            name=dtype.name,
            path_template=dtype.path_template,
            custom_field_ids=dtype.custom_field_ids,
            user_id=user.id,
        )
    except Exception as e:
        error_msg = str(e)
        if "UNIQUE constraint failed" in error_msg:
            raise HTTPException(status_code=400, detail="Document type already exists")
        raise HTTPException(status_code=400, detail=error_msg)

    return document_type


@router.delete(
    "/{document_type_id}",
    status_code=204,
    responses={
        404: {
            "description": """No document type with specified ID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_DELETE)
def delete_document_type(
    document_type_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_DELETE])
    ],
    db_session: Session = Depends(get_session),
) -> None:
    """Deletes document type

    Required scope: `{scope}`
    """
    try:
        db.delete_document_type(db_session, document_type_id)
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document type not found")


@router.patch(
    "/{document_type_id}", status_code=200, response_model=schemas.DocumentType
)
@utils.docstring_parameter(scope=scopes.DOCUMENT_TYPE_UPDATE)
def update_document_type(
    document_type_id: uuid.UUID,
    attrs: schemas.UpdateDocumentType,
    cur_user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.DOCUMENT_TYPE_UPDATE])
    ],
    db_session: Session = Depends(get_session),
) -> schemas.DocumentType:
    """Updates document type

    Required scope: `{scope}`
    """
    try:
        dtype: schemas.DocumentType = db.update_document_type(
            db_session,
            document_type_id=document_type_id,
            attrs=attrs,
            user_id=cur_user.id,
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document type not found")

    return dtype
