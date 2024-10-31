from pydantic import BaseModel

from papermerge.core.features.document_types.schema import (
    CreateDocumentType,
    UpdateDocumentType,
)
from papermerge.core.features.nodes.schema import Node

from .scopes import Scopes
from .tags import CreateTag, Tag, UpdateTag
from .version import Version

__all__ = [
    "Tag",
    "CreateTag",
    "UpdateTag",
    "Version",
    "Scopes",
    "CreateDocumentType",
    "UpdateDocumentType",
]
