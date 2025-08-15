import logging
from typing import Annotated, List

from fastapi import APIRouter, Security, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.config import get_settings
from papermerge.core import utils, schema, orm
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.page_mngm.db.api import apply_pages_op
from papermerge.core.features.page_mngm.db.api import \
    extract_pages as api_extract_pages
from papermerge.core.features.page_mngm.db.api import \
    move_pages as api_move_pages
from papermerge.core.db.engine import get_db

logger = logging.getLogger(__name__)
config = get_settings()
MAX_PAGES = 10

router = APIRouter(
    prefix="/pages",
    tags=["pages"],
)

@router.post("/")
@utils.docstring_parameter(scope=scopes.PAGE_UPDATE)
async def apply_page_operations(
    items: List[schema.PageAndRotOp],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.PAGE_UPDATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Document:
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
    new_doc = await apply_pages_op(db_session, items, user_id=user.id)

    return schema.Document.model_validate(new_doc)


@router.post("/move")
@utils.docstring_parameter(scope=scopes.PAGE_MOVE)
async def move_pages(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.PAGE_MOVE])],
    arg: schema.MovePagesIn,
    db_session: AsyncSession = Depends(get_db),
) -> schema.MovePagesOut:
    """Moves pages between documents.

    Required scope: `{scope}`

    Source IDs are IDs of the pages to move.
    Target is the ID of the page before/after which to insert source pages.

    Returns updated, with newly added versions, source and target documents.
    In case source document is deleted, which may happen when user
    moves all it's pages into the target, the returned source will
    be None.
    """
    [source, target] = await api_move_pages(
        db_session,
        source_page_ids=arg.source_page_ids,
        target_page_id=arg.target_page_id,
        move_strategy=arg.move_strategy,
        user_id=user.id,
    )
    if source is not None:
        source = await doc_dbapi.load_doc(db_session, doc_id=source.id)
    target = await doc_dbapi.load_doc(db_session, doc_id=target.id)

    model = schema.MovePagesOut(source=source, target=target)

    return schema.MovePagesOut.model_validate(model)


@router.post("/extract")
@utils.docstring_parameter(scope=scopes.PAGE_EXTRACT)
async def extract_pages(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.PAGE_EXTRACT])
    ],
    arg: schema.ExtractPagesIn,
    db_session: AsyncSession = Depends(get_db),
) -> schema.ExtractPagesOut:
    """Extract pages from one document into a folder.

    Required scope: `{scope}`

    Source IDs are IDs of the pages to move.
    Target is the ID of the folder where to extract pages into.
    """
    [source, target_docs] = await api_extract_pages(
        db_session,
        source_page_ids=arg.source_page_ids,
        target_folder_id=arg.target_folder_id,
        strategy=arg.strategy,
        title_format=arg.title_format,
        user_id=user.id,
    )
    stmt = select(orm.Document).where(
        orm.Document.id.in_([doc.id for doc in target_docs])
    )
    target_nodes = (await db_session.execute(stmt)).scalars()

    if source is not None:
        source = await doc_dbapi.load_doc(db_session, source.id)

    model = schema.ExtractPagesOut(source=source, target=target_nodes)

    return schema.ExtractPagesOut.model_validate(model)
