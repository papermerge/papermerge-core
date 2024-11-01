import logging
import uuid
from typing import Annotated, Union
from uuid import UUID

from celery import current_app
from fastapi import APIRouter, Depends, HTTPException, Query, Security

from papermerge.core import utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.constants import INDEX_ADD_NODE
from papermerge.core.db.engine import Session
from papermerge.core.features.users import schema as users_schema
from papermerge.core.features.document import schema as doc_schema
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.features.nodes import schema as nodes_schema
from papermerge.core.features.nodes.db import api as nodes_dbapi
from papermerge.core.routers.common import OPEN_API_GENERIC_JSON_DETAIL
from papermerge.core.routers.paginator import PaginatedResponse
from papermerge.core.routers.params import CommonQueryParams
from papermerge.core.utils.decorators import skip_in_tests
from papermerge.core import config
from papermerge.core.exceptions import EntityNotFound

router = APIRouter(prefix="/nodes", tags=["nodes"])

logger = logging.getLogger(__name__)
settings = config.get_settings()


@router.get("/")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_nodes_details(
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    node_ids: list[uuid.UUID] | None = Query(default=None),
) -> list[nodes_schema.Folder | doc_schema.Document]:
    """Returns detailed information about queried nodes
    (breadcrumb, tags)

    Required scope: `{scope}`
    """
    if node_ids is None:
        return []

    if len(node_ids) == 0:
        return []

    nodes = db.get_nodes(db_session, node_ids)

    return nodes


@router.get(
    "/{parent_id}",
    response_model=PaginatedResponse[Union[doc_schema.Document, nodes_schema.Folder]],
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node(
    parent_id,
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    params: CommonQueryParams = Depends(),
):
    """Returns a list nodes of parent_id

    Required scope: `{scope}`
    """
    order_by = ["ctype", "title", "created_at", "updated_at"]

    if params.order_by:
        order_by = [item.strip() for item in params.order_by.split(",")]

    with Session() as db_session:
        results = nodes_dbapi.get_paginated_nodes(
            db_session=db_session,
            parent_id=UUID(parent_id),
            user_id=user.id,
            page_size=params.page_size,
            page_number=params.page_number,
            order_by=order_by,
            filter=params.filter,
        )

    return results


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.NODE_CREATE)
def create_node(
    pynode: nodes_schema.NewFolder | doc_schema.NewDocument,
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_CREATE])
    ],
) -> nodes_schema.Folder | doc_schema.Document | None:
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
        new_folder = nodes_schema.NewFolder(**attrs)
        with Session() as db_session:
            created_node, error = nodes_dbapi.create_folder(
                db_session, new_folder, user_id=user.id
            )
    else:
        # if user does not specify document's language, get that
        # value from user preferences
        if pynode.lang is None:
            pynode.lang = settings.papermerge__ocr__default_language

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

        new_document = doc_schema.NewDocument(**attrs)

        with Session() as db_session:
            created_node, error = doc_dbapi.create_document(
                db_session, new_document, user_id=user.id
            )

    if error:
        raise HTTPException(status_code=400, detail=error.model_dump())

    return created_node


@router.patch("/{node_id}")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_node(
    node_id: UUID,
    node: nodes_schema.UpdateNode,
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> nodes_schema.Node:
    """Updates node

    Required scope: `{scope}`

    parent_id is optional field. However, when present, parent_id
    should be non empty string (UUID).
    """

    with Session() as db_session:
        updated_node = nodes_dbapi.update_node(
            db_session, node_id=node_id, user_id=user.id, attrs=node
        )

    return updated_node


@router.delete("/")
@utils.docstring_parameter(scope=scopes.NODE_DELETE)
def delete_nodes(
    list_of_uuids: list[UUID],
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_DELETE])
    ],
) -> list[UUID]:
    """Deletes nodes with specified UUIDs

    Required scope: `{scope}`

    Returns a list of UUIDs of actually deleted nodes.
    In case nothing was deleted (e.g. no nodes with specified UUIDs
    were found) - will return an empty list.
    """
    deleted_nodes_uuids = []
    for node in BaseTreeNode.objects.filter(user_id=user.id, id__in=list_of_uuids):
        deleted_nodes_uuids.append(node.id)
        node.delete()

    return deleted_nodes_uuids


@router.post(
    "/move",
    responses={
        432: {
            "description": """Move of mentioned node is not possible due
            to duplicate title on the target""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
        404: {
            "description": """No target node with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL,
        },
    },
)
@utils.docstring_parameter(scope=scopes.NODE_MOVE)
def move_nodes(
    params: nodes_schema.MoveNode,
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_MOVE])
    ],
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
        target_model = BaseTreeNode.objects.get(pk=params.target_id)
    except BaseTreeNode.DoesNotExist as exc:
        logger.error(exc, exc_info=True)
        raise HTTPException(status_code=404, detail="Target not found")

    for node_model in BaseTreeNode.objects.filter(pk__in=params.source_ids):
        try:
            move_node(node_model, target_model)
        except IntegrityError as exc:
            logger.error(exc, exc_info=True)
            raise HTTPException(
                status_code=432,
                detail=f"Move not possible for '{node_model.title}'"
                " because node with same title already present on the target",
            )

    return params.source_ids


@router.post("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def assign_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> doc_schema.Document | nodes_schema.Folder:
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

    _notify_index(node_id)

    return node


@router.patch("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> doc_schema.Document | nodes_schema.Folder:
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

    _notify_index(node.id)

    return node


@router.delete("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def delete_node_tags(
    node_id: UUID,
    tags: list[str],
    user: Annotated[
        users_schema.User, Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ],
) -> nodes_schema.Node:
    """
    Dissociate given tags the node.

    Required scope: `{scope}`

    Tags models are not deleted - just dissociated from the node.
    """
    try:
        node = BaseTreeNode.objects.get(id=node_id, user_id=user.id)
    except BaseTreeNode.DoesNotExist:
        raise HTTPException(status_code=404, detail="Does not exist")

    node.tags.remove(*tags)

    return nodes_schema.Node.model_validate(node)


@skip_in_tests
def _notify_index(node_id: uuid.UUID):
    id_as_str = str(node_id)  # just in case, make sure it is str
    current_app.send_task(
        INDEX_ADD_NODE, kwargs={"node_id": id_as_str}, route_name="i3"
    )
