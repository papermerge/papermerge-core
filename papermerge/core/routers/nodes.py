from typing import List
from fastapi import APIRouter
from papermerge.core.schemas.nodes import Node as PyNode
from papermerge.core.models import BaseTreeNode

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.get("/")
def get_nodes() -> List[PyNode]:
    return [PyNode.from_orm(node) for node in BaseTreeNode.objects.all()]


@router.post("/")
def create_node() -> PyNode:
    pass
