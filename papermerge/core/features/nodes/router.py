import logging
import uuid
from typing import Annotated, Iterable, Union
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy.exc import NoResultFound, IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from papermerge.core.exceptions import HTTP404NotFound, EntityNotFound
from papermerge.core.constants import INDEX_REMOVE_NODE
from papermerge.core.tasks import send_task
from papermerge.core import utils, schema, config
from papermerge.core.features.auth import scopes, get_current_user
from papermerge.core.constants import INDEX_ADD_NODE
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.nodes.db import api as nodes_dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.types import PaginatedResponse
from papermerge.core.db import common as dbapi_common
from papermerge.core import exceptions as exc
from papermerge.core.db.engine import get_db
from papermerge.core.features.audit.db.audit_context import AsyncAuditContext

router = APIRouter(prefix="/nodes", tags=["nodes"])

logger = logging.getLogger(__name__)
settings = config.get_settings()


@router.get(
    "/{parent_id}",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
async def get_node(
    parent_id: UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    params: CommonQueryParams = Depends(),
    db_session: AsyncSession = Depends(get_db),
) -> PaginatedResponse[Union[schema.DocumentNode, schema.Folder]]:
    """Returns list of *paginated* direct descendants of `parent_id` node

    Required scope: `{scope}`
    """
    order_by = ["ctype", "title", "created_at", "updated_at"]

    if params.order_by:
        order_by = [item.strip() for item in params.order_by.split(",")]

    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=parent_id,
        codename=scopes.NODE_VIEW,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    nodes = await nodes_dbapi.get_paginated_nodes(
        db_session=db_session,
        parent_id=parent_id,
        user_id=user.id,
        page_size=params.page_size,
        page_number=params.page_number,
        order_by=order_by,
        filter=params.filter,
    )

    return nodes


@router.post(
    "/",
    status_code=201,
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_CREATE}` permission on the parent node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(
    scope=scopes.NODE_CREATE,
)
async def create_node(
    pynode: schema.NewFolder | schema.NewDocument,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_CREATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Folder | schema.Document | None:
    """Creates a node

    Required scope: `{scope}`

    Node's `ctype` may be either `folder` or `document`.
    Optionally you may pass ID attribute. If ID is present and has
    non-emtpy UUID value, then newly create node will be assigned this
    custom ID.
    If node has `parent_id` empty then node will not be accessible to user.
    The only nodes with `parent_id` set to empty value are "user custom folders"
    like Home and Inbox.
    """
    if pynode.ctype == "folder":
        attrs = dict(
            title=pynode.title,
            ctype="folder",
            parent_id=pynode.parent_id,
        )
        if pynode.id:
            attrs["id"] = pynode.id
        new_folder = schema.NewFolder(**attrs)

        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            created_node, error = await nodes_dbapi.create_folder(db_session, new_folder)
    else:
        # if user does not specify document's language, get that
        # value from user preferences
        if pynode.lang is None:
            pynode.lang = settings.papermerge__ocr__default_lang_code

        attrs = dict(
            title=pynode.title,
            lang=pynode.lang,
            parent_id=pynode.parent_id,
            size=0,
            page_count=0,
            ocr=pynode.ocr,
            file_name=pynode.title,
            ctype="document",
        )
        if pynode.id:
            attrs["id"] = pynode.id

        new_document = schema.NewDocument(**attrs)

        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=pynode.parent_id,
            codename=scopes.NODE_CREATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        async with AsyncAuditContext(
            db_session,
            user_id=user.id,
            username=user.username
        ):
            created_node, error = await doc_dbapi.create_document(db_session, new_document)

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(created_node.id)}, route_name="i3")
    return created_node


@router.patch(
    "/{node_id}",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
async def update_node(
    node_id: UUID,
    node: schema.UpdateNode,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Node:
    """Updates node

    Required scope: `{scope}`

    parent_id is optional field. However, when present, parent_id
    should be not empty string (UUID).
    """

    if not await dbapi_common.has_node_perm(
        db_session,
        node_id=node_id,
        codename=scopes.NODE_UPDATE,
        user_id=user.id,
    ):
        raise exc.HTTP403Forbidden()

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
        updated_node = await nodes_dbapi.update_node(
            db_session, node_id=node_id, user_id=user.id, attrs=node
        )

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(updated_node.id)}, route_name="i3")

    return updated_node


@router.delete(
    "/",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"No `{scopes.NODE_DELETE}` permission on some of the nodes"
            "at least one of the specified nodes",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_DELETE)
async def delete_nodes(
    list_of_uuids: list[UUID],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_DELETE])
    ],
    db_session: AsyncSession = Depends(get_db),
):
    """Deletes nodes with specified UUIDs

    Required scope: `{scope}`

    Returns a list of UUIDs of actually deleted nodes.
    In case nothing was deleted (e.g. no nodes with specified UUIDs
    were found) - will return an empty list.
    """
    for node_id in list_of_uuids:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=node_id,
            codename=scopes.NODE_DELETE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

    async with AsyncAuditContext(
        db_session,
        user_id=user.id,
        username=user.username
    ):
        error = await nodes_dbapi.delete_nodes(
            db_session, node_ids=list_of_uuids, user_id=user.id
        )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(
        INDEX_REMOVE_NODE,
        kwargs={"item_ids": [str(i) for i in list_of_uuids]},
        route_name="i3",
    )


@router.post(
    "/move",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"Check user has `{scopes.NODE_MOVE}` on all source nodes "
            f" and `{scopes.NODE_UPDATE}` on the target node.",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        432: {
            "description": """Move of mentioned node is not possible due
            to duplicate title on the target""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        400: {
            "description": """No target node with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        419: {
            "description": """No nodes were updated""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        420: {
            "description": """Not all nodes were updated""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.NODE_MOVE)
async def move_nodes(
    params: schema.MoveNode,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_MOVE])],
    db_session: AsyncSession = Depends(get_db),
) -> list[UUID]:
    """Move source nodes into the target node.

    User should have

        * `node.update` permission for the target node
        * `node.move` permission for each source node

    Required scope: `{scope}`

    In other words, after successful completion of this action
    all source nodes will have target node as their parent.
    Think of set of folders and/or documents being moved from one
    folder into another folder.

    Returns UUIDs of successfully moved nodes.
    """
    try:
        for source_id in params.source_ids:
            if not await dbapi_common.has_node_perm(
                db_session,
                node_id=source_id,
                codename=scopes.NODE_MOVE,
                user_id=user.id,
            ):
                raise exc.HTTP403Forbidden()

        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=params.target_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        async with AsyncAuditContext(
                db_session,
                user_id=user.id,
                username=user.username
        ):
            affected_row_count = await nodes_dbapi.move_nodes(
                db_session,
                source_ids=params.source_ids,
                target_id=params.target_id,
            )
    except NoResultFound as e:
        logger.error(e, exc_info=True)
        error = schema.Error(
            messages=["No results found. Please check that all source nodes exists"]
        )
        raise HTTPException(status_code=404, detail=error.model_dump())
    except (IntegrityError, EntityNotFound) as e:
        logger.debug(exc, exc_info=True)
        error = schema.Error(
            messages=["Integrity error. Please check that target exists"]
        )
        raise HTTPException(status_code=400, detail=error.model_dump())

    if affected_row_count == 0:
        error = schema.Error(
            messages=["No nodes were updated. Please check that source nodes exists"]
        )
        raise HTTPException(status_code=419, detail=error.model_dump())

    if affected_row_count != len(params.source_ids):
        error = schema.Error(
            messages=[
                "Not all nodes were updated"
                f"(only {affected_row_count} out of {len(params.source_ids)})."
                " Please check that all source nodes exists"
            ]
        )
        raise HTTPException(status_code=420, detail=error.model_dump())

    return params.source_ids


@router.post(
    "/{node_id}/tags",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"User does not have `{scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
async def assign_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Document | schema.Folder:
    """
    Assigns given list of tag names to the node.

    Required scope: `{scope}`

    All tags not present in given list of tags names
    will be disassociated from the node; in other words upon
    successful completion of the request node will have ONLY
    tags from the list.
    Yet another way of thinking about http POST is as it **replaces
    existing node tags** with the one from input list.
    """
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=node_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        node, error = await nodes_dbapi.assign_node_tags(
            db_session, node_id=node_id, tags=tags, user_id=user.id
        )
    except EntityNotFound:
        raise HTTP404NotFound

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(node_id)}, route_name="i3")

    return node


@router.get(
    "/",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"User does not have `{scopes.NODE_VIEW}` permission on "
            "some of the nodes",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        }
    },
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
async def get_nodes_details(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    node_ids: list[uuid.UUID] | None = Query(default=None),
    db_session: AsyncSession = Depends(get_db),
) -> list[schema.Folder | schema.Document]:
    """Returns detailed information about queried nodes
    (breadcrumb, tags)

    Dev note: this API endpoint is used by UI to fetch tags and breadcrumbs
    for the *search results*, as search index does not store these attributes.

    Required scope: `{scope}`
    """
    if node_ids is None:
        return []

    if len(node_ids) == 0:
        return []

    for node_id in node_ids:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=node_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

    nodes = await nodes_dbapi.get_nodes(db_session, node_ids=node_ids, user_id=user.id)

    return nodes


@router.patch(
    "/{node_id}/tags",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"User does not have `{scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
async def update_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Document | schema.Folder:
    """
    Appends given list of tag names to the node.

    Required scope: `{scope}`

    Retains all previously associated node tags.
    Yet another way of thinking about http PATCH method is as it
    **appends** input tags to the currently associated tags.

    Example:

        Node N1 has 'invoice', 'important' tags.

        After following request:

            POST /api/nodes/<N1>/tags/

            tags: ['paid']

        Node N1 will have 'invoice', 'important', 'paid' tags.
        Notice that previously associated 'invoice' and 'important' tags
        are still assigned to N1.
    """
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=node_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        node, error = await nodes_dbapi.update_node_tags(
            db_session, node_id=node_id, tags=tags, user_id=user.id
        )
    except EntityNotFound:
        raise HTTP404NotFound

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(node_id)}, route_name="i3")

    return node


@router.get(
    "/{node_id}/tags",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"User does not have `{scopes.NODE_VIEW}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
async def get_node_tags(
    node_id: UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    db_session=Depends(get_db),
) -> Iterable[schema.Tag]:
    """
    Retrieves nodes tags

    Required scope: `{scope}`
    """
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=node_id,
            codename=scopes.NODE_VIEW,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        tags, error = await nodes_dbapi.get_node_tags(
            db_session, node_id=node_id, user_id=user.id
        )
    except EntityNotFound:
        raise HTTP404NotFound

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return tags


@router.delete(
    "/{node_id}/tags",
    responses={
        status.HTTP_403_FORBIDDEN: {
            "description": f"User does not have `{scopes.NODE_UPDATE}` permission on the node",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
async def remove_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
    db_session: AsyncSession = Depends(get_db),
) -> schema.Document | schema.Folder:
    """
    Dissociate given tags the node.

    Required scope: `{scope}`

    Tags models are not deleted - just dissociated from the node.
    """
    try:
        if not await dbapi_common.has_node_perm(
            db_session,
            node_id=node_id,
            codename=scopes.NODE_UPDATE,
            user_id=user.id,
        ):
            raise exc.HTTP403Forbidden()

        node, error = await nodes_dbapi.remove_node_tags(
            db_session, node_id=node_id, tags=tags, user_id=user.id
        )
    except EntityNotFound:
        raise HTTP404NotFound

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(node_id)}, route_name="i3")

    return node
