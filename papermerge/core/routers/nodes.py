import logging
import uuid
from typing import Annotated, List, Union
from uuid import UUID

from celery import current_app
from django.conf import settings
from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Security, Query
from fastapi.responses import RedirectResponse

from papermerge.core import db, schemas, utils
from papermerge.core.auth import get_current_user, scopes
from papermerge.core.constants import INDEX_ADD_NODE
from papermerge.core.models import BaseTreeNode, Document, Folder, User
from papermerge.core.models.node import move_node
from papermerge.core.schemas.documents import \
    CreateDocument as PyCreateDocument
from papermerge.core.schemas.documents import Document as PyDocument
from papermerge.core.schemas.folders import CreateFolder as PyCreateFolder
from papermerge.core.schemas.folders import Folder as PyFolder
from papermerge.core.schemas.nodes import MoveNode as PyMoveNode
from papermerge.core.schemas.nodes import Node as PyNode
from papermerge.core.schemas.nodes import UpdateNode as PyUpdateNode
from papermerge.core.utils.decorators import skip_in_tests

from .common import OPEN_API_GENERIC_JSON_DETAIL
from .paginator import PaginatedResponse
from .params import CommonQueryParams

router = APIRouter(
    prefix="/nodes",
    tags=["nodes"]
)

logger = logging.getLogger(__name__)


@router.get("/")
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_nodes_details(
    user: Annotated[
        schemas.User,
        Security(
            get_current_user,
            scopes=[scopes.NODE_VIEW]
        )
    ],
    node_ids: list[uuid.UUID] | None = Query(default=None),
    db_session: db.Session = Depends(db.get_session)
) -> list[PyFolder | PyDocument]:
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
    response_model=PaginatedResponse[Union[PyDocument, PyFolder]]
)
@utils.docstring_parameter(scope=scopes.NODE_VIEW)
def get_node(
    parent_id,
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.NODE_VIEW])
    ],
    params: CommonQueryParams = Depends(),
    engine: db.Engine = Depends(db.get_engine)
):
    """Returns a list nodes of parent_id

    Required scope: `{scope}`
    """
    order_by = ['ctype', 'title', 'created_at', 'updated_at']

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return db.get_paginated_nodes(
        engine=engine,
        parent_id=UUID(parent_id),
        user_id=user.id,
        page_size=params.page_size,
        page_number=params.page_number,
        order_by=order_by,
        filter=params.filter
    )


@router.post("/", status_code=201)
@utils.docstring_parameter(scope=scopes.NODE_CREATE)
def create_node(
    pynode: PyCreateFolder | PyCreateDocument,
    user: Annotated[
        schemas.User,
        Security(
            get_current_user,
            scopes=[scopes.NODE_CREATE]
        )
    ]
) -> PyFolder | PyDocument:
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
    try:
        if pynode.ctype == "folder":
            attrs = dict(
                title=pynode.title,
                user_id=user.id,
                parent_id=pynode.parent_id
            )
            if pynode.id:
                attrs['id'] = pynode.id

            node = Folder.objects.create(**attrs)
            klass = PyFolder
        else:
            # if user does not specify document's language, get that
            # value from user preferences
            if pynode.lang is None:
                pynode.lang = settings.OCR__DEFAULT_LANGUAGE

            attrs = dict(
                title=pynode.title,
                lang=pynode.lang,
                user_id=user.id,
                parent_id=pynode.parent_id,
                size=0,
                page_count=0,
                ocr=pynode.ocr,
                file_name=pynode.title
            )
            if pynode.id:
                attrs['id'] = pynode.id

            node = Document.objects.create_document(**attrs)
            klass = PyDocument
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Title already exists"
        )

    return klass.model_validate(node)


@router.patch("/{node_id}")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_node(
    node_id: UUID,
    node: PyUpdateNode,
    user: Annotated[
        User,
        Security(get_current_user, scopes=[scopes.NODE_UPDATE])
    ]
) -> PyNode:
    """Updates node

    Required scope: `{scope}`

    parent_id is optional field. However, when present, parent_id
    should be non empty string (UUID).
    """

    try:
        old_node = BaseTreeNode.objects.get(id=node_id, user_id=user.id)
    except BaseTreeNode.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exist"
        )

    for key, value in node.model_dump().items():
        if value is not None:
            setattr(old_node, key, value)
    old_node.save()

    return PyNode.model_validate(old_node)


@router.delete("/")
@utils.docstring_parameter(scope=scopes.NODE_DELETE)
def delete_nodes(
    list_of_uuids: List[UUID],
    user: Annotated[
        schemas.User,
        Security(get_current_user, scopes=[scopes.NODE_DELETE])
    ]
) -> List[UUID]:
    """Deletes nodes with specified UUIDs

    Required scope: `{scope}`

    Returns a list of UUIDs of actually deleted nodes.
    In case nothing was deleted (e.g. no nodes with specified UUIDs
    were found) - will return an empty list.
    """
    deleted_nodes_uuids = []
    for node in BaseTreeNode.objects.filter(
        user_id=user.id, id__in=list_of_uuids
    ):
        deleted_nodes_uuids.append(node.id)
        node.delete()

    return deleted_nodes_uuids


@router.post(
    "/move",
    responses={
        432: {
            "description": """Move of mentioned node is not possible due
            to duplicate title on the target""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        },
        404: {
            "description": """No target node with specified UUID found""",
            "content": OPEN_API_GENERIC_JSON_DETAIL
        }
    }
)
@utils.docstring_parameter(scope=scopes.NODE_MOVE)
def move_nodes(
    params: PyMoveNode,
    user: Annotated[
        schemas.User,
        Security(
            get_current_user,
            scopes=[scopes.NODE_MOVE]
        )
    ]
) -> List[UUID]:
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
        raise HTTPException(
            status_code=404,
            detail="Target not found"
        )

    for node_model in BaseTreeNode.objects.filter(pk__in=params.source_ids):
        try:
            move_node(node_model, target_model)
        except IntegrityError as exc:
            logger.error(exc, exc_info=True)
            raise HTTPException(
                status_code=432,
                detail=f"Move not possible for '{node_model.title}'"
                " because node with same title already present on the target"
            )

    return params.source_ids


@router.post("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def assign_node_tags(
    node_id: UUID,
    tags: List[str],
    user: Annotated[
        schemas.User,
        Security(
            get_current_user,
            scopes=[scopes.NODE_UPDATE]
        )
    ]
) -> schemas.Document | schemas.Folder:
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
        node = BaseTreeNode.objects.get(id=node_id, user_id=user.id)
    except BaseTreeNode.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exist"
        )

    node.tags.set(tags, tag_kwargs={"user_id": user.id})
    _notify_index(str(node_id))

    if node.ctype == "folder":
        return schemas.Folder.model_validate(node)

    return schemas.Document.model_validate(node)


@router.patch("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def update_node_tags(
    node_id: UUID,
    tags: List[str],
    user: Annotated[
        schemas.User,
        Security(
            get_current_user,
            scopes=[scopes.NODE_UPDATE]
        )
    ]
) -> PyNode:
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
        node = BaseTreeNode.objects.get(id=node_id, user_id=user.id)
    except BaseTreeNode.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exist"
        )

    node.tags.add(*tags, tag_kwargs={"user_id": user.id})
    _notify_index(node_id)

    return PyNode.model_validate(node)


@router.delete("/{node_id}/tags")
@utils.docstring_parameter(scope=scopes.NODE_UPDATE)
def delete_node_tags(
    node_id: UUID,
    tags: List[str],
        user: Annotated[
            schemas.User,
            Security(
                get_current_user,
                scopes=[scopes.NODE_UPDATE]
            )
        ]
) -> PyNode:
    """
    Dissociate given tags the node.

    Required scope: `{scope}`

    Tags models are not deleted - just dissociated from the node.
    """
    try:
        node = BaseTreeNode.objects.get(id=node_id, user_id=user.id)
    except BaseTreeNode.DoesNotExist:
        raise HTTPException(
            status_code=404,
            detail="Does not exist"
        )

    node.tags.remove(*tags)

    return PyNode.model_validate(node)


@skip_in_tests
def _notify_index(node_id: str):
    id_as_str = str(node_id)  # just in case, make sure it is str
    current_app.send_task(
        INDEX_ADD_NODE,
        kwargs={'node_id': id_as_str},
        route_name='i3'
    )
