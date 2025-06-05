import logging
import os
import uuid
from typing import Annotated

from sqlalchemy.exc import NoResultFound
from fastapi import APIRouter, HTTPException, Security, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel

from papermerge.core.db.engine import Session
from papermerge.core import utils, db
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.document.db import api as dbapi
from papermerge.core.pathlib import rel2abs, thumbnail_path
from papermerge.core.utils import image
from papermerge.core.db.common import has_node_perm
from papermerge.core.exceptions import HTTP403Forbidden, HTTP404NotFound


from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL

router = APIRouter(
    prefix="/thumbnails",
    tags=["thumbnails"],
)

logger = logging.getLogger(__name__)


class Message(BaseModel):
    detail: str


class JPEGFileResponse(FileResponse):
    media_type = "application/jpeg"


@router.get(
    "/{document_id}",
    response_class=JPEGFileResponse,
    responses={
        309: {
            "description": """Preview image cannot be generated at this moment
             yet. This may happen for example because the document is currently
            still being uploaded. A later response may succeed with 200 status
            code.""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        404: {
            "description": """Document with specified UUID was not found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.PAGE_VIEW)
def get_document_thumbnail(
    document_id: uuid.UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.PAGE_VIEW])
    ],
    db_session=Depends(db.get_db)
):
    """Retrieves thumbnail of the document last version's first page

    Required scope: `{scope}`
    """

    ok = has_node_perm(
        db_session, user_id=user.id, codename=scopes.PAGE_VIEW, node_id=document_id
    )
    if not ok:
        raise HTTP403Forbidden()

    try:
        doc_ver = dbapi.get_last_doc_ver(db_session, doc_id=document_id)
    except NoResultFound:
        raise HTTP404NotFound
    try:
        page = dbapi.get_first_page(db_session, doc_ver_id=doc_ver.id)
    except NoResultFound:
        raise HTTPException(
            status_code=309,
            detail="Not ready for preview yet",
        )

    jpg_abs_path = rel2abs(thumbnail_path(page.id))

    if not os.path.exists(jpg_abs_path):
        image.gen_doc_thumbnail(
            page_id=page.id,
            doc_ver_id=doc_ver.id,
            page_number=1,
            file_name=doc_ver.file_name,
        )

    return JPEGFileResponse(jpg_abs_path)
