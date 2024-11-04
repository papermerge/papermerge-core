from papermerge.core.features.document_types.schema import (
    CreateDocumentType,
    UpdateDocumentType,
)

from .scopes import Scopes
from .version import Version

__all__ = [
    "Version",
    "Scopes",
    "CreateDocumentType",
    "UpdateDocumentType",
]
