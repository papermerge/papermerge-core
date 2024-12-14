import logging
import uuid
from typing import Annotated, Iterable
from uuid import UUID


from fastapi import APIRouter, Depends, HTTPException, Query, Security
from sqlalchemy.exc import NoResultFound, IntegrityError

from papermerge.core.constants import INDEX_REMOVE_NODE
from papermerge.core.tasks import send_task
from papermerge.core import utils, schema, config
from papermerge.core.features.auth import scopes, get_current_user
from papermerge.core.constants import INDEX_ADD_NODE
from papermerge.core.db.engine import Session
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.nodes.db import api as nodes_dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.exceptions import EntityNotFound


router = APIRouter(prefix="/nodes", tags=["nodes"])

logger = logging.getLogger(__name__)
settings = config.get_settings()


@router.get("/{parent_id}")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node(
    parent_id,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    params: CommonQueryParams = Depends(),
):
    """Returns a list nodes of parent_id

    Required scope: `{scope}`
    """
    order_by = ["ctype", "title", "created_at", "updated_at"]

    if params.order_by:
        order_by = [item.strip() for item in params.order_by.split(",")]

    with Session() as db_session:
        nodes = nodes_dbapi.get_paginated_nodes(
            db_session=db_session,
            parent_id=UUID(parent_id),
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            order_by=order_by,
            filter=params.filter,
        )

    return nodes


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.NODE_CREATE)
def create_node(
    pynode: schema.NewFolder | schema.NewDocument,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_CREATE])
    ],
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
            user_id=user.id,
            parent_id=pynode.parent_id,
        )
        if pynode.id:
            attrs["id"] = pynode.id
        new_folder = schema.NewFolder(**attrs)
        with Session() as db_session:
            created_node, error = nodes_dbapi.create_folder(
                db_session, new_folder, user_id=user.id
            )
    else:
        # if user does not specify document's language, get that
        # value from user preferences
        if pynode.lang is None:
            pynode.lang = settings.papermerge__ocr__default_lang_code

        attrs = dict(
            title=pynode.title,
            lang=pynode.lang,
            user_id=user.id,
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

        with Session() as db_session:
            created_node, error = doc_dbapi.create_document(
                db_session, new_document, user_id=user.id
            )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(created_node.id)}, route_name="i3")
    return created_node


@router.patch("/{node_id}")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_node(
    node_id: UUID,
    node: schema.UpdateNode,
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> schema.Node:
    """Updates node

    Required scope: `{scope}`

    parent_id is optional field. However, when present, parent_id
    should be non empty string (UUID).
    """

    with Session() as db_session:
        updated_node = nodes_dbapi.update_node(
            db_session, node_id=node_id, user_id=user.id, attrs=node
        )

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(updated_node.id)}, route_name="i3")
    return updated_node


@router.delete("/")
@utils.docstring_parameter(scope=scopes.NODE_DELETE)
def delete_nodes(
    list_of_uuids: list[UUID],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_DELETE])
    ],
):
    """Deletes nodes with specified UUIDs

    Required scope: `{scope}`

    Returns a list of UUIDs of actually deleted nodes.
    In case nothing was deleted (e.g. no nodes with specified UUIDs
    were found) - will return an empty list.
    """
    with Session() as db_session:
        error = nodes_dbapi.delete_nodes(
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
def move_nodes(
    params: schema.MoveNode,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_MOVE])],
) -> list[UUID]:
    """Move source nodes into the target node.

    Required scope: `{scope}`

    In other words, after successful completion of this action
    all source nodes will have target node as their parent.
    Think of set of folders and/or documents being moved from one
    folder into another folder.

    Returns UUIDs of successfully moved nodes.
    """
    try:
        with Session() as db_session:
            affected_row_count = nodes_dbapi.move_nodes(
                db_session,
                source_ids=params.source_ids,
                target_id=params.target_id,
                user_id=user.id,
            )
    except NoResultFound as exc:
        logger.error(exc, exc_info=True)
        error = schema.Error(
            messages=["No results found. Please check that all source nodes exists"]
        )
        raise HTTPException(status_code=404, detail=error.model_dump())
    except (IntegrityError, EntityNotFound) as exc:
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


@router.post("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def assign_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
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
        with Session() as db_session:
            node, error = nodes_dbapi.assign_node_tags(
                db_session, node_id=node_id, tags=tags, user_id=user.id
            )
    except EntityNotFound:
        raise HTTPException(status_code=404, detail="Does not exist")

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(node_id)}, route_name="i3")

    return node


@router.get("/")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_nodes_details(
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
    node_ids: list[uuid.UUID] | None = Query(default=None),
) -> list[schema.Folder | schema.Document]:
    """Returns detailed information about queried nodes
    (breadcrumb, tags)

    Required scope: `{scope}`
    """
    if node_ids is None:
        return []

    if len(node_ids) == 0:
        return []

    with Session() as db_session:
        nodes = nodes_dbapi.get_nodes(db_session, node_ids=node_ids, user_id=user.id)

    return nodes


@router.patch("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
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
        with Session() as db_session:
            node, error = nodes_dbapi.update_node_tags(
                db_session, node_id=node_id, tags=tags, user_id=user.id
            )
    except EntityNotFound:
        raise HTTPException(status_code=404, detail="Does not exist")

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(node_id)}, route_name="i3")

    return node


@router.get("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node_tags(
    node_id: UUID,
    user: Annotated[schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])],
) -> Iterable[schema.Tag]:
    """
    Retrieves nodes tags

    Required scope: `{scope}`
    """
    try:
        with Session() as db_session:
            tags, error = nodes_dbapi.get_node_tags(
                db_session, node_id=node_id, user_id=user.id
            )
    except EntityNotFound:
        raise HTTPException(status_code=404, detail="Does not exist")

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return tags


@router.delete("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def remove_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> schema.Document | schema.Folder:
    """
    Dissociate given tags the node.

    Required scope: `{scope}`

    Tags models are not deleted - just dissociated from the node.
    """
    try:
        with Session() as db_session:
            node, error = nodes_dbapi.remove_node_tags(
                db_session, node_id=node_id, tags=tags, user_id=user.id
            )
    except EntityNotFound:
        raise HTTPException(status_code=404, detail="Does not exist")

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    send_task(INDEX_ADD_NODE, kwargs={"node_id": str(node_id)}, route_name="i3")

    return node
