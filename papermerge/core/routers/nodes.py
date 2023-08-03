import logging
from typing import List
from uuid import UUID

from django.db.utils import IntegrityError
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

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

from .auth import get_current_user as current_user
from .paginator import PaginatorGeneric, paginate
from .params import CommonQueryParams

router = APIRouter(
    prefix="/nodes",
    tags=["nodes"]
)

logger = logging.getLogger(__name__)


@router.get("/")
def get_nodes(user: User = Depends(current_user)) -> RedirectResponse:
    """Redirects to current user home folder"""
    parent_id = str(user.home_folder.id)
    return RedirectResponse(
        f"/nodes/{parent_id}"
    )


@router.get("/{parent_id}", response_model=PaginatorGeneric[PyNode])
@paginate
def get_node(
    parent_id,
    params: CommonQueryParams = Depends(),
    user: User = Depends(current_user)
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


@router.post("/", status_code=201)
def create_node(
    pynode: PyCreateFolder | PyCreateDocument,
    user: User = Depends(current_user)
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
                pynode.lang = user.preferences['ocr__language']

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

    return klass.from_orm(node)


@router.patch("/{node_id}")
def update_node(
    node_id: UUID,
    node: PyUpdateNode,
    user: User = Depends(current_user)
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

    for key, value in node.dict().items():
        if value is not None:
            setattr(old_node, key, value)
    old_node.save()

    return PyNode.from_orm(old_node)


@router.delete("/")
def delete_nodes(
    list_of_uuids: List[UUID],
    user: User = Depends(current_user)
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
        deleted_nodes_uuids.append(
            node.id
        )
        node.delete()

    return deleted_nodes_uuids


@router.post("/move")
def move_nodes(
    params: PyMoveNode,
    user: User = Depends(current_user)
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
        move_node(node_model, target_model)

    return params.source_ids


@router.post("/{node_id}/tags")
def assign_node_tags(
    node_id: UUID,
    tags: List[str],
    user: User = Depends(current_user)
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

    return PyNode.model_validate(node)


@router.patch("/{node_id}/tags")
def update_node_tags(
    node_id: UUID,
    tags: List[str],
    user: User = Depends(current_user)
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

    return PyNode.from_orm(node)


@router.delete("/{node_id}/tags")
def delete_node_tags(
    node_id: UUID,
    tags: List[str],
    user: User = Depends(current_user)
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

    return PyNode.from_orm(node)
