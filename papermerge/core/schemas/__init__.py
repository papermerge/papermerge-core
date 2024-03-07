from pydantic import BaseModel

from .documents import CreateDocument, Document, DocumentVersion, Page
from .folders import CreateFolder, Folder
from .nodes import Node
from .perms import Permission
from .tags import CreateTag, Tag, UpdateTag
from .users import CreateUser, RemoteUser, UpdateUser, User
from .version import Version

__all__ = [
    'Tag',
    'CreateTag',
    'UpdateTag',
    'User',
    'CreateUser',
    'UpdateUser',
    'RemoteUser',
    'Folder',
    'Node',
    'CreateFolder',
    'Page',
    'Permission',
    'Document',
    'DocumentVersion',
    'CreateDocument',
    'Version'
]


class ExtractPagesOut(BaseModel):
    source: Document | None
    target: list[Node]


class MovePagesOut(BaseModel):
    source: Document | None
    target: Document
