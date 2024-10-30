from pydantic import BaseModel

from papermerge.core.features.document_types.schema import (
    CreateDocumentType,
    UpdateDocumentType,
)

from .documents import (
    CreateDocument,
    Document,
    DocumentVersion,
    Page,
)
from .folders import CreateFolder, Folder
from .nodes import Node, OrderBy
from .scopes import Scopes
from .tags import CreateTag, Tag, UpdateTag
from .users import CreateUser, RemoteUser, UpdateUser, User, UserDetails
from .version import Version

__all__ = [
    "Tag",
    "CreateTag",
    "UpdateTag",
    "User",
    "CreateUser",
    "UpdateUser",
    "RemoteUser",
    "UserDetails",
    "Folder",
    "Node",
    "OrderBy",
    "CreateFolder",
    "Page",
    "Document",
    "DocumentVersion",
    "CreateDocument",
    "Version",
    "Scopes",
    "CreateDocumentType",
    "UpdateDocumentType",
]


class ExtractPagesOut(BaseModel):
    source: Document | None
    target: list[Node]


class MovePagesOut(BaseModel):
    source: Document | None
    target: Document
