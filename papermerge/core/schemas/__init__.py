from pydantic import BaseModel

from papermerge.core.features.document_types.schema import (
    CreateDocumentType,
    UpdateDocumentType,
)
from papermerge.core.features.nodes.schema import Node

from .documents import (
    CreateDocument,
    Document,
    DocumentVersion,
    Page,
)
from .scopes import Scopes
from .tags import CreateTag, Tag, UpdateTag
from .version import Version

__all__ = [
    "Tag",
    "CreateTag",
    "UpdateTag",
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
