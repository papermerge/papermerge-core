import logging
from typing import List
from uuid import UUID

from celery import current_app
from django.conf import settings
from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

from papermerge.core import db, schemas
from papermerge.core.auth import get_current_user
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
from .paginator import PaginatedResponse, PaginatorGeneric, paginate
from .params import CommonQueryParams

router = APIRouter(
    prefix="/nodes",
    tags=["nodes"]
)

logger = logging.getLogger(__name__)


@router.get("/")
def get_nodes(
    user: schemas.User = Depends(get_current_user)
) -> RedirectResponse:
    """Redirects to current user home folder"""
    parent_id = str(user.home_folder_id)
    return RedirectResponse(
        f"/nodes/{parent_id}"
    )


@router.get("/{parent_id}", response_model=PaginatorGeneric[PyNode])
@paginate
def get_node(
    parent_id,
    params: CommonQueryParams = Depends(),
    user: schemas.User = Depends(get_current_user)
):
    """Returns a list nodes with given parent_id of the current user"""
    order_by = ['ctype', 'title', 'created_at', 'updated_at']

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return BaseTreeNode.objects.filter(
        parent_id=parent_id,
        user_id=user.id
    ).order_by(*order_by)


@router.get("/v2/{parent_id}", response_model=PaginatedResponse[PyNode])
def get_node2(
    parent_id,
    params: CommonQueryParams = Depends(),
    user: schemas.User = Depends(get_current_user),
    engine: db.Engine = Depends(db.get_engine)
):
    """Returns a list nodes with given parent_id of the current user"""
    order_by = ['ctype', 'title', 'created_at', 'updated_at']

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    response = db.get_paginated_nodes(
        engine=engine,
        parent_id=parent_id,
        user_id=user.id,
        page_size=params.page_size,
        page_number=params.page_number,
        order_by=order_by
    )

    return response


@router.post("/", status_code=201)
def create_node(
    pynode: PyCreateFolder | PyCreateDocument,
    user: schemas.User = Depends(get_current_user)
) -> PyFolder | PyDocument:

    try:
        if pynode.ctype == "folder":
            node = Folder.objects.create(
                title=pynode.title,
                user_id=user.id,
                parent_id=pynode.parent_id
            )
            klass = PyFolder
        else:
            # if user does not specify document's language, get that
            # value from user preferences
            if pynode.lang is None:
                pynode.lang = settings.OCR__DEFAULT_LANGUAGE

            node = Document.objects.create_document(
                title=pynode.title,
                lang=pynode.lang,
                user_id=user.id,
                parent_id=pynode.parent_id,
                size=0,
                page_count=0,
                file_name=pynode.title
            )
            klass = PyDocument
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Title already exists"
        )

    return klass.model_validate(node)


@router.patch("/{node_id}")
def update_node(
    node_id: UUID,
    node: PyUpdateNode,
    user: User = Depends(get_current_user)
) -> PyNode:
    """Updates node

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
def delete_nodes(
    list_of_uuids: List[UUID],
    user: schemas.User = Depends(get_current_user)
) -> List[UUID]:
    """Deletes nodes with specified UUIDs

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
def move_nodes(
    params: PyMoveNode,
    user: schemas.User = Depends(get_current_user)
) -> List[UUID]:
    """Move source nodes into the target node.

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
def assign_node_tags(
    node_id: UUID,
    tags: List[str],
    user: schemas.User = Depends(get_current_user)
) -> PyNode:
    """
    Assigns given list of tag names to the node.

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

    node.tags.set(tags, tag_kwargs={"user": user})
    _notify_index(node_id)

    return PyNode.model_validate(node)


@router.patch("/{node_id}/tags")
def update_node_tags(
    node_id: UUID,
    tags: List[str],
    user: schemas.User = Depends(get_current_user)
) -> PyNode:
    """
    Appends given list of tag names to the node.

    Retains all previously associated node tags.
    Yet another way of thinking about http PATCH method is as it
    **appends** input tags to the currently associated tags.

    Example:

        Node N1 has 'invoice', 'important' tags.

        After following request:

            POST /api/nodes/{N1}/tags/
            {tags: ['paid']}

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

    node.tags.add(*tags, tag_kwargs={"user": user})
    _notify_index(node_id)

    return PyNode.model_validate(node)


@router.delete("/{node_id}/tags")
def delete_node_tags(
    node_id: UUID,
    tags: List[str],
    user: schemas.User = Depends(get_current_user)
) -> PyNode:
    """
    Dissociate given tags the node.

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
    current_app.send_task(INDEX_ADD_NODE, (id_as_str,))
