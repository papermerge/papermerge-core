import logging
import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.responses import FileResponse

from papermerge.core import db
from papermerge.core import pathlib as core_pathlib
from papermerge.core import schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.constants import DEFAULT_PAGE_SIZE
from papermerge.core.db import exceptions as db_exc
from papermerge.core.models import BaseTreeNode
from papermerge.core.page_ops import apply_pages_op
from papermerge.core.page_ops import extract_pages as api_extract_pages
from papermerge.core.page_ops import move_pages as api_move_pages
from papermerge.core.schemas import ExtractPagesOut, MovePagesOut
from papermerge.core.schemas.documents import DocumentVersion as PyDocVer
from papermerge.core.schemas.pages import (ExtractPagesIn, MovePagesIn,
                                           PageAndRotOp)
from papermerge.core.utils import image

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
@utils.docstring_parameter(scope=scopes.PAGE_VIEW)
def get_page_svg_url(
    page_id: uuid.UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.PAGE_VIEW])
    ],
    engine: db.Engine = Depends(db.get_engine)
):
    """View page as SVG

    Required scope: `{scope}`
    """

    try:
        page = db.get_page(engine, id=page_id, user_id=user.id)
    except db_exc.PageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Page not found"
        )

    svg_abs_path = core_pathlib.abs_page_svg_path(str(page.id))
    logger.debug(f"page UUID={page_id} svg abs path={svg_abs_path}")

    if not svg_abs_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return SVGFileResponse(svg_abs_path)


@router.get("/{page_id}/jpg", response_class=JPEGFileResponse)
@utils.docstring_parameter(scope=scopes.PAGE_VIEW)
def get_page_jpg_url(
    page_id: uuid.UUID,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.PAGE_VIEW])
    ],
    size: int = Query(
        DEFAULT_PAGE_SIZE,
        description="jpg image width in pixels"
    ),
    engine: db.Engine = Depends(db.get_engine)
):
    """Returns jpg preview image of the page.

    Required scope: `{scope}`

    Returned jpg image's width is `size` pixels.
    """
    try:
        page = db.get_page(engine, id=page_id, user_id=user.id)
        doc_ver = db.get_doc_ver(engine, id=page.document_version_id)
    except db_exc.PageNotFound:
        raise HTTPException(
            status_code=404,
            detail="Page does not exist"
        )

    logger.debug(
        f"Generating page preview for page.number={page.number}"
        f" page.id={page.id}"
    )
    jpeg_abs_path = core_pathlib.rel2abs(
        core_pathlib.thumbnail_path(page.id, size=size)
    )

    if not jpeg_abs_path.exists():
        # generate preview only for this page
        image.generate_thumbnail(
            page_id=page.id,
            doc_ver_id=doc_ver.id,
            page_number=page.number,
            file_name=doc_ver.file_name,
            size=size
        )

    logger.debug(f"jpeg_abs_path={jpeg_abs_path}")

    return JPEGFileResponse(jpeg_abs_path)


@router.post("/")
@utils.docstring_parameter(scope=scopes.PAGE_UPDATE)
def apply_page_operations(
    items: List[PageAndRotOp],
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.PAGE_UPDATE])
    ],
) -> List[PyDocVer]:
    """Applies reorder, delete and/or rotate operation(s) on a set of pages.

    Required scope: `{scope}`

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
@utils.docstring_parameter(scope=scopes.PAGE_MOVE)
def move_pages(
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.PAGE_MOVE])
    ],
    arg: MovePagesIn
) -> MovePagesOut:
    """Moves pages between documents.

    Required scope: `{scope}`

    Source IDs are IDs of the pages to move.
    Target is the ID of the page before/after which to insert source pages.

    Returns updated, with newly added versions, source and target documents.
    In case source document is deleted, which may happen when user
    moves all it's pages into the target, the returned source will
    be None.
    """
    [source, target] = api_move_pages(
        source_page_ids=arg.source_page_ids,
        target_page_id=arg.target_page_id,
        move_strategy=arg.move_strategy
    )
    model = MovePagesOut(source=source, target=target)

    return MovePagesOut.model_validate(model)


@router.post("/extract")
@utils.docstring_parameter(scope=scopes.PAGE_EXTRACT)
def extract_pages(
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.PAGE_EXTRACT])
    ],
    arg: ExtractPagesIn
) -> ExtractPagesOut:
    """Extract pages from one document into a folder.

    Required scope: `{scope}`

    Source IDs are IDs of the pages to move.
    Target is the ID of the folder where to extract pages into.
    """
    [source, target_docs] = api_extract_pages(
        source_page_ids=arg.source_page_ids,
        target_folder_id=arg.target_folder_id,
        strategy=arg.strategy,
        title_format=arg.title_format
    )
    target_nodes = BaseTreeNode.objects.filter(
        pk__in=[doc.id for doc in target_docs]
    )
    model = ExtractPagesOut(source=source, target=target_nodes)

    return ExtractPagesOut.model_validate(model)
