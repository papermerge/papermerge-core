from pydantic import BaseModel

from .documents import CreateDocument, Document, DocumentVersion, Page
from .folders import CreateFolder, Folder
from .groups import CreateGroup, Group, GroupDetails, UpdateGroup
from .nodes import Node
from .perms import Permission
from .scopes import Scopes
from .tags import CreateTag, Tag, UpdateTag
from .users import CreateUser, RemoteUser, UpdateUser, User, UserDetails
from .version import Version

__all__ = [
    'Tag',
    'CreateTag',
    'UpdateTag',
    'User',
    'CreateUser',
    'UpdateUser',
    'RemoteUser',
    'UserDetails',
    'Folder',
    'Node',
    'CreateFolder',
    'Page',
    'Permission',
    'Document',
    'DocumentVersion',
    'CreateDocument',
    'Version',
    'Scopes',
    'Group',
    'GroupDetails',
    'CreateGroup',
    'UpdateGroup',
]


class ExtractPagesOut(BaseModel):
    source: Document | None
    target: list[Node]


class MovePagesOut(BaseModel):
    source: Document | None
    target: Document
