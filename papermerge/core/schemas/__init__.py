from pydantic import BaseModel

from .custom_fields import (
    CFV,
    CreateCustomField,
    CustomField,
    CustomFieldType,
    CustomFieldValue,
    UpdateCustomField,
)
from .document_types import CreateDocumentType, DocumentType, UpdateDocumentType
from .documents import (
    CreateDocument,
    Document,
    DocumentCustomFieldsAdd,
    DocumentCustomFieldsAddValue,
    DocumentCustomFieldsUpdate,
    DocumentCustomFieldsUpdateValue,
    DocumentVersion,
    Page,
)
from .folders import CreateFolder, Folder
from .groups import CreateGroup, Group, GroupDetails, UpdateGroup
from .nodes import Node, OrderBy
from .perms import Permission
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
    "Permission",
    "Document",
    "DocumentVersion",
    "CreateDocument",
    "Version",
    "Scopes",
    "Group",
    "GroupDetails",
    "CreateGroup",
    "UpdateGroup",
    "CustomField",
    "CreateCustomField",
    "UpdateCustomField",
    "CustomFieldType",
    "CustomFieldValue",
    "CFV",
    "CreateDocumentType",
    "DocumentType",
    "UpdateDocumentType",
    "DocumentCustomFieldsUpdate",
    "DocumentCustomFieldsUpdateValue",
    "DocumentCustomFieldsAdd",
    "DocumentCustomFieldsAddValue",
]


class ExtractPagesOut(BaseModel):
    source: Document | None
    target: list[Node]


class MovePagesOut(BaseModel):
    source: Document | None
    target: Document
