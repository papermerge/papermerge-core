import logging
from typing import Annotated, List

from fastapi import APIRouter, Security, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.config import get_settings
from papermerge.core import utils, schema, orm, exceptions as exc
from papermerge.core.db import common as dbapi_common
from papermerge.core.features.auth import get_current_user
from papermerge.core.features.auth import scopes
from papermerge.core.features.page_mngm.db.api import apply_pages_op
from papermerge.core.features.page_mngm.db.api import \
    extract_pages as api_extract_pages
from papermerge.core.features.page_mngm.db.api import \
    move_pages as api_move_pages
from papermerge.core.db.engine import get_db
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext

logger = logging.getLogger(__name__)
config = get_settings()
MAX_PAGES = 10

router = APIRouter(
    prefix="/pages",
    tags=["pages"],
)

@router.post("/")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
async def apply_page_operations(
    items: List[schema.PageAndRotOp],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
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
    if not items:
        return schema.Document.model_validate(None)

    page_ids = [item.page.id for item in items]
    stmt = (
        select(orm.DocumentVersion.document_id)
        .select_from(orm.Page)
        .join(orm.DocumentVersion, orm.Page.document_version_id == orm.DocumentVersion.id)
        .where(orm.Page.id.in_(page_ids))
        .distinct()
    )
    doc_ids = (await db_session.execute(stmt)).scalars().all()
    if not doc_ids:
        raise exc.HTTP404NotFound()

    for doc_id in doc_ids:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
        new_doc = await apply_pages_op(db_session, items, user_id=user.id)

    return schema.Document.model_validate(new_doc)


@router.post("/move")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
async def move_pages(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])],
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
    stmt_src = (
        select(orm.DocumentVersion.document_id)
        .select_from(orm.Page)
        .join(orm.DocumentVersion, orm.Page.document_version_id == orm.DocumentVersion.id)
        .where(orm.Page.id.in_(arg.source_page_ids))
        .distinct()
    )
    src_doc_ids = (await db_session.execute(stmt_src)).scalars().all()
    if not src_doc_ids:
        raise exc.HTTP404NotFound()

    for doc_id in src_doc_ids:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

    stmt_tgt = (
        select(orm.DocumentVersion.document_id)
        .select_from(orm.Page)
        .join(orm.DocumentVersion, orm.Page.document_version_id == orm.DocumentVersion.id)
        .where(orm.Page.id == arg.target_page_id)
    )
    tgt_doc_id = (await db_session.execute(stmt_tgt)).scalar_one_or_none()
    if not tgt_doc_id:
        raise exc.HTTP404NotFound()

    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=tgt_doc_id,
        codename=scopes.NODE_UPDATE,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
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
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
async def extract_pages(
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
    arg: schema.ExtractPagesIn,
    db_session: AsyncSession = Depends(get_db),
) -> schema.ExtractPagesOut:
    """Extract pages from one document into a folder.

    Required scope: `{scope}`

    Source IDs are IDs of the pages to move.
    Target is the ID of the folder where to extract pages into.
    """
    stmt_src = (
        select(orm.DocumentVersion.document_id)
        .select_from(orm.Page)
        .join(orm.DocumentVersion, orm.Page.document_version_id == orm.DocumentVersion.id)
        .where(orm.Page.id.in_(arg.source_page_ids))
        .distinct()
    )
    src_doc_ids = (await db_session.execute(stmt_src)).scalars().all()
    if not src_doc_ids:
        raise exc.HTTP404NotFound()

    for doc_id in src_doc_ids:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=doc_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=arg.target_folder_id,
        codename=scopes.NODE_UPDATE,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
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
