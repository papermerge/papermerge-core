import logging
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

from papermerge.core.constants import DEFAULT_THUMBNAIL_SIZE
from papermerge.core.models import Page, User
from papermerge.core.page_operations import apply_pages_op
from papermerge.core.page_operations import move_pages as api_move_pages
from papermerge.core.pathlib import rel2abs, thumbnail_path
from papermerge.core.schemas.documents import DocumentVersion as PyDocVer
from papermerge.core.schemas.documents import MovePagesOut
from papermerge.core.schemas.pages import MovePagesIn, PageAndRotOp

from .auth import get_current_user as current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/pages",
    tags=["pages"],
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
    try:
        page = Page.objects.get(
            id=page_id, document_version__document__user=user
        )
    except Page.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Page not found"
        )

    svg_abs_path = page.svg_path
    logger.debug(f"page UUID={page_id} svg abs path={svg_abs_path}")

    if not page.svg_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return SVGFileResponse(page.svg_path)


@router.get("/{page_id}/jpg", response_class=JPEGFileResponse)
def get_page_jpg_url(
    page_id: uuid.UUID,
    size: int = Query(
        DEFAULT_THUMBNAIL_SIZE,
        description="jpg image width in pixels"
    ),
    user: User = Depends(current_user)
):
    """Returns jpg preview image of the page.

    Returned jpg image's width is `size` pixels.
    """
    try:
        page = Page.objects.get(
            id=page_id,
            document_version__document__user=user
        )
    except Page.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Page does not exist"
        )

    logger.debug(
        f"Generating page preview for page.number={page.number}"
        f" page.id={page.id}"
    )
    jpeg_abs_path = rel2abs(
        thumbnail_path(page.id, size=size)
    )

    if not os.path.exists(jpeg_abs_path):
        # generate preview only for this page
        page.generate_thumbnail(size=size)

    logger.debug(f"jpeg_abs_path={jpeg_abs_path}")

    return JPEGFileResponse(jpeg_abs_path)


@router.post("/")
def apply_page_operations(
    items: List[PageAndRotOp],
) -> List[PyDocVer]:
    """Applies reorder, delete and/or rotate operation(s) on a set of pages.

    Creates a new document version which will contain
    only the pages provided as input in given order and with
    applied rotation. The deletion operation is implicit:
    pages not included in input won't be added to the new document version
    which from user perspective means that pages were deleted.
    Order in which input pages are provided is very important because
    new document version will add pages in exact same order.

    Will rotate page `angle` degrees relative to the current angle.
    * `angle` can have positive or negative value
    * `angle` must be a multiple of 90

    When `angle` > 0 -> the rotation is clockwise.
    When `angle` < 0 -> the rotation is counterclockwise.
    """
    new_versions = apply_pages_op(items)

    return [PyDocVer.model_validate(version) for version in new_versions]


@router.post("/move")
def move_pages(arg: MovePagesIn) -> MovePagesOut:
    """Moves pages between documents.

    Source IDs are IDs of the pages to move.
    Target is the ID of the page before/after which to insert source pages.

    Returns updated, with newly added versions, source and target documents.
    In case source document is deleted, which may happen when user
    moves all it's pages into the target, the returned source will
    be None i.e returned value will be {'source': null, target: {...}}.
    """
    [source, target] = api_move_pages(
        source_page_ids=arg.source_page_ids,
        target_page_id=arg.target_page_id,
        move_strategy=arg.move_strategy
    )
    model = MovePagesOut(source=source, target=target)

    return MovePagesOut.model_validate(model)
