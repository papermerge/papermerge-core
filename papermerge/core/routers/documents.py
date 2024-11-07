import io
import uuid
from typing import Annotated

from celery.app import default_app as celery_app
from fastapi import APIRouter, Depends, HTTPException, Query, Security, UploadFile
from pydantic import BaseModel
from sqlalchemy.exc import NoResultFound

from papermerge.conf import settings
from papermerge.core import constants as const
from papermerge.core import db, schemas, utils
from core.auth import get_current_user
from core.features.auth import scopes
from papermerge.core.features.document.schema import DocumentCFV
from papermerge.core.models import Document
from papermerge.core.types import OrderEnum, PaginatedResponse

OrderBy = Annotated[
    str | None,
    Query(
        description="""
    Name of custom field e.g. 'Total EUR' (without quotes). Note that
    custom field name is case sensitive and may include spaces
"""
    ),
]

PageSize = Annotated[int, Query(ge=1, lt=100, description="Number of items per page")]
PageNumber = Annotated[
    int,
    Query(ge=1, description="Page number. It is first, second etc. page?"),
]

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


class DocumentTypeArg(BaseModel):
    document_type_id: uuid.UUID | None = None


@router.get("/type/{document_type_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_documents_by_type(
    document_type_id: uuid.UUID,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    page_size: PageSize = 5,
    page_number: PageNumber = 1,
    db_session: db.Session = Depends(db.get_session),
    order_by: OrderBy = None,
    order: OrderEnum = OrderEnum.desc,
) -> PaginatedResponse[DocumentCFV]:
    """
    Get all documents of specific type with all custom field values

    Required scope: `{scope}`
    """

    items = db.get_docs_by_type(
        db_session,
        type_id=document_type_id,
        user_id=user.id,
        order_by=order_by,
        order=order,
        page_number=page_number,
        page_size=page_size,
    )
    total_count = db.get_docs_count_by_type(db_session, type_id=document_type_id)

    return PaginatedResponse(
        page_size=page_size,
        page_number=page_number,
        num_pages=int(total_count / page_size) + 1,
        items=items,
    )


@router.patch("/{document_id}/type")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_document_type(
    document_id: uuid.UUID,
    document_type: DocumentTypeArg,
    user: Annotated[
        schemas.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    db_session: db.Session = Depends(db.get_session),
):
    """
    Updates document type

    Required scope: `{scope}`
    """
    try:
        db.update_doc_type(
            db_session,
            document_id=document_id,
            document_type_id=document_type.document_type_id,
        )
    except NoResultFound:
        raise HTTPException(status_code=404, detail="Document not found")
