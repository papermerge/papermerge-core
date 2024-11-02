import uuid
from typing import Annotated

from celery.app import default_app as celery_app
from fastapi import APIRouter, HTTPException, Security
from sqlalchemy.exc import NoResultFound

from papermerge.core import constants as const
from papermerge.core import schemas, utils
from core.auth import get_current_user
from core.features.auth import scopes
from papermerge.core.db.engine import Session
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.document.db import api as dbapi

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.patch("/{document_id}/custom-fields")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_document_custom_field_values(
    document_id: uuid.UUID,
    custom_fields_update: list[doc_schema.DocumentCustomFieldsUpdate],
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> list[doc_schema.CFV]:
    """
    Update document's custom fields
    Required scope: `{scope}`
    """
    custom_fields = {}
    for cf in custom_fields_update:
        if cf.value is None and cf.custom_field_value_id is None:
            continue
        custom_fields[cf.key] = cf.value

    with Session() as db_session:
        try:
            updated_entries = dbapi.update_doc_cfv(
                db_session,
                document_id=document_id,
                custom_fields=custom_fields,
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Document not found")

    celery_app.send_task(
        const.PATH_TMPL_MOVE_DOCUMENT,
        kwargs={"document_id": str(document_id), "user_id": str(user.id)},
        route_name="path_tmpl",
    )

    return updated_entries


@router.get("/{document_id}/custom-fields")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_document_custom_field_values(
    document_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
) -> list[doc_schema.CFV]:
    """
    Get document custom field values

    Required scope: `{scope}`
    """
    with Session() as db_session:
        try:
            doc = dbapi.get_doc_cfv(
                db_session,
                document_id=document_id,
            )
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Document not found")

    return doc
