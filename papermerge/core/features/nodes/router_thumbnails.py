import logging
import os
import uuid
from typing import Annotated

from sqlalchemy.exc import NoResultFound
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.responses import FileResponse
from pydantic import BaseModel

from papermerge.core.db.engine import Session
from papermerge.core import pathlib as core_pathlib
from papermerge.core import utils
from papermerge.core.features.users import schema as usr_schema
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.document.db import api as dbapi
from papermerge.core.constants import DEFAULT_THUMBNAIL_SIZE
from papermerge.core.pathlib import rel2abs, thumbnail_path
from papermerge.core.utils import image

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
def retrieve_document_thumbnail(
    document_id: uuid.UUID,
    user: Annotated[
        usr_schema.User, Security(get_current_user, scopes=[scopes.PAGE_VIEW])
    ],
    size: int = DEFAULT_THUMBNAIL_SIZE,
):
    """Retrieves thumbnail of the document last version's first page

    Required scope: `{scope}`
    """

    with Session() as db_session:
        try:
            doc_ver = dbapi.get_last_doc_ver(
                db_session, user_id=user.id, doc_id=document_id
            )
        except NoResultFound:
            raise HTTPException(
                status_code=404, detail=f"Document with ID={document_id} not found"
            )

        try:
            page = dbapi.get_first_page(db_session, doc_ver_id=doc_ver.id)
        except NoResultFound:
            raise HTTPException(
                status_code=309,
                detail="Not ready for preview yet",
            )

    jpeg_abs_path = rel2abs(thumbnail_path(page.id, size=size))

    if not os.path.exists(jpeg_abs_path):
        thb_path = core_pathlib.abs_thumbnail_path(str(page.id), size=size)
        pdf_path = core_pathlib.abs_docver_path(str(doc_ver.id), str(doc_ver.file_name))

        image.generate_preview(
            pdf_path=pdf_path, output_folder=thb_path.parent, page_number=1, size=size
        )

    return JPEGFileResponse(jpeg_abs_path)
