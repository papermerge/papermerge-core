from pydantic import BaseModel

from .documents import CreateDocument, Document, DocumentVersion, Page
from .folders import CreateFolder, Folder
from .nodes import Node
from .tags import CreateTag, Tag, UpdateTag
from .users import User

__all__ = [
    'Tag',
    'CreateTag',
    'UpdateTag',
    'User',
    'Folder',
    'Node',
    'CreateFolder',
    'Page',
    'Document',
    'DocumentVersion',
    'CreateDocument'
]


class ExtractPagesOut(BaseModel):
    source: Document | None
    target: list[Node]


class MovePagesOut(BaseModel):
    source: Document | None
    target: Document
