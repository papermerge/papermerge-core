import logging
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from papermerge.core.models import User, Page
from papermerge.core.storage import abs_path


from .auth import oauth2_scheme
from .auth import get_current_user as current_user


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/pages",
    tags=["pages"],
    dependencies=[Depends(oauth2_scheme)]
)


class SVGFileResponse(FileResponse):
    media_type = 'application/svg'


class JPEGFileResponse(FileResponse):
    media_type = 'application/jpeg'


@router.get("/{page_id}/svg", response_class=SVGFileResponse)
def get_page_svg_url(
    page_id: uuid.UUID,
    user: User = Depends(current_user)
):
    page = Page.objects.get(id=page_id)
    if page.document_version.document.user.id != user.id:
        raise HTTPException(
            status_code=401,
            detail="Owner does not match"
        )

    svg_abs_path = abs_path(page.page_path.svg_url)
    logger.debug(f"page UUID={page_id} svg abs path={svg_abs_path}")

    if not os.path.exists(svg_abs_path):
        raise HTTPException(
            status_code=404,
            detail="Target not found"
        )

    return SVGFileResponse(svg_abs_path)


@router.get("/{page_id}/jpg", response_class=JPEGFileResponse)
def get_page_jpg_url(
    page_id: uuid.UUID,
    user: User = Depends(current_user)
):
    page = Page.objects.get(id=page_id)
    if page.document_version.document.user.id != user.id:
        raise HTTPException(
            status_code=401,
            detail="Owner does not match"
        )

    jpeg_abs_path = abs_path(page.page_path.preview_url)

    if not os.path.exists(jpeg_abs_path):
        # generate preview only for this page
        page.document_version.generate_previews(
            page_number=page.number
        )

    if not os.path.exists(jpeg_abs_path):
        raise HTTPException(
            status_code=404,
            detail="Target not found"
        )

    return JPEGFileResponse(jpeg_abs_path)
