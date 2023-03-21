from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse

from django.db.utils import IntegrityError

from papermerge.core.models import User
from papermerge.core.schemas.nodes import Node as PyNode
from papermerge.core.schemas.folders import Folder as PyFolder
from papermerge.core.schemas.folders import CreateFolder as PyCreateFolder
from papermerge.core.schemas.users import User as PyUser
from papermerge.core.models import BaseTreeNode, Folder

from .auth import oauth2_scheme
from .auth import get_current_user as current_user
from .params import CommonQueryParams
from .paginator import PaginatorGeneric, paginate


router = APIRouter(
    prefix="/nodes",
    tags=["nodes"],
    dependencies=[Depends(oauth2_scheme)]
)


@router.get("/")
def get_nodes(user: PyUser = Depends(current_user)) -> RedirectResponse:
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
    user: User = Depends(current_user)
):
    """Returns a list nodes with given parent_id of the current user"""
    order_by = ['ctype', 'title']

    if params.order_by:
        order_by = [
            item.strip() for item in params.order_by.split(',')
        ]

    return BaseTreeNode.objects.filter(
        parent_id=parent_id,
        user_id=user.id
    ).order_by(*order_by)


@router.post("/")
def create_node(
    pyfolder: PyCreateFolder,
    user: PyUser = Depends(current_user)
) -> PyFolder:

    try:
        folder = Folder.objects.create(
            title=pyfolder.title,
            user_id=user.id,
            parent_id=pyfolder.parent_id
        )
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Title already exists"
        )

    return PyFolder.from_orm(folder)


@router.delete("/")
def delete_nodes(
    list_of_uuids: List[UUID],
    user: PyUser = Depends(current_user)
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
