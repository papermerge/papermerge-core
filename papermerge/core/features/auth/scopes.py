"""
Permission scopes
"""
from enum import Enum
from typing import Dict, List, Set


class ScopeCategory(Enum):
    """Categories of permission scopes."""
    NODE = "node"
    DOCUMENT = "document"
    TAG = "tag"
    USER = "user"
    GROUP = "group"
    ROLE = "role"
    TASK = "task"
    OCR = "ocr"
    PAGE = "page"
    CUSTOM_FIELD = "custom_field"
    DOCUMENT_TYPE = "document_type"
    SHARED_NODE = "shared_node"
    AUDIT_LOG = "audit_log"
    SYSTEM_PREFERENCE = "system_preference"


class Action(Enum):
    """Available actions for scopes."""
    CREATE = "create"
    VIEW = "view"
    UPDATE = "update"
    DELETE = "delete"
    MOVE = "move"
    SELECT = "select"
    UPLOAD = "upload"
    DOWNLOAD = "download"
    EXTRACT = "extract"
    # Special actions
    ME = "me"
    OCR = "ocr"
    ALL_VERSIONS = "download.all_versions"
    LAST_VERSION_ONLY = "download.last_version_only"
    UPDATE_TITLE = "update.title"
    UPDATE_TAGS = "update.tags"
    UPDATE_METADATA = "update.custom_fields"


class Scopes:
    """Permission scopes"""

    # Node permissions
    NODE_CREATE = "node.create"
    NODE_VIEW = "node.view"
    NODE_UPDATE = "node.update"
    NODE_DELETE = "node.delete"
    NODE_MOVE = "node.move"

    # Document permissions
    DOCUMENT_UPLOAD = "document.upload"
    DOCUMENT_DOWNLOAD = "document.download"
    DOCUMENT_DOWNLOAD_ALL_VERSIONS = "document.download.all_versions"
    DOCUMENT_DOWNLOAD_LAST_VERSION_ONLY = "document.download.last_version_only"
    DOCUMENT_UPDATE_TITLE = "document.update.title"
    DOCUMENT_UPDATE_TAGS = "document.update.tags"
    DOCUMENT_UPDATE_CUSTOM_FIELDS = "document.update.custom_fields"
    DOCUMENT_UPDATE_CATEGORY = "document.update.document_type"

    # Tag permissions
    TAG_SELECT = "tag.select"  # User can pick from dropdown
    TAG_CREATE = "tag.create"
    TAG_VIEW = "tag.view"
    TAG_UPDATE = "tag.update"
    TAG_DELETE = "tag.delete"

    # User permissions
    USER_CREATE = "user.create"
    USER_SELECT = "user.select"  # User can pick from dropdown
    USER_VIEW = "user.view"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_ME = "user.me"

    # Group permissions
    GROUP_CREATE = "group.create"
    GROUP_SELECT = "group.select"  # User can pick from dropdown
    GROUP_VIEW = "group.view"
    GROUP_UPDATE = "group.update"
    GROUP_DELETE = "group.delete"

    # Role permissions
    ROLE_CREATE = "role.create"
    ROLE_VIEW = "role.view"
    ROLE_SELECT = "role.select"  # User can pick from dropdown
    ROLE_UPDATE = "role.update"
    ROLE_DELETE = "role.delete"

    # Task permissions
    TASK_OCR = "task.ocr"

    # OCR language permissions
    OCRLANG_VIEW = "ocrlang.view"

    # Page permissions
    PAGE_VIEW = "page.view"      # absolete: will be removed in 3.6 (or 3.7)
    PAGE_UPDATE = "page.update"  # absolete: will be removed in 3.6 (or 3.7)
    PAGE_REORDER = "page.reorder"
    PAGE_ROTATE = "page.rotate"
    PAGE_MOVE = "page.move"
    PAGE_EXTRACT = "page.extract"
    PAGE_DELETE = "page.delete"

    # Custom field permissions
    CUSTOM_FIELD_CREATE = "custom_field.create"
    CUSTOM_FIELD_VIEW = "custom_field.view"
    CUSTOM_FIELD_UPDATE = "custom_field.update"
    CUSTOM_FIELD_DELETE = "custom_field.delete"

    # Document type permissions
    DOCUMENT_TYPE_CREATE = "document_type.create"
    DOCUMENT_TYPE_VIEW = "document_type.view"
    DOCUMENT_TYPE_SELECT = "document_type.select"
    DOCUMENT_TYPE_UPDATE = "document_type.update"
    DOCUMENT_TYPE_DELETE = "document_type.delete"

    # Shared node permissions
    SHARED_NODE_CREATE = "shared_node.create"
    SHARED_NODE_VIEW = "shared_node.view"
    SHARED_NODE_UPDATE = "shared_node.update"
    SHARED_NODE_DELETE = "shared_node.delete"

    # Audit log permissions
    AUDIT_LOG_VIEW = "audit_log.view"

    # System preferences
    SYSTEM_PREFERENCE_VIEW = "system_preference.view"
    SYSTEM_PREFERENCE_UPDATE = "system_preference.update"

    # API Tokens
    API_TOKEN_VIEW = "api_token.view"
    API_TOKEN_CREATE = "api_token.create"
    API_TOKEN_DELETE = "api_token.delete"

    @classmethod
    def all_scopes(cls) -> Set[str]:
        """Return all available scopes."""
        return {
            value for name, value in cls.__dict__.items()
            if isinstance(value, str) and not name.startswith('_')
        }

    @classmethod
    def get_scopes_by_category(cls, category: str) -> List[str]:
        """Get all scopes for a specific category."""
        return [
            value for name, value in cls.__dict__.items()
            if isinstance(value, str) and value.startswith(f"{category}.")
        ]

    @classmethod
    def get_crud_scopes(cls, category: str) -> Dict[str, str]:
        """Get CRUD scopes for a category."""
        crud_actions = ["create", "view", "update", "delete"]
        result = {}

        for action in crud_actions:
            scope_name = f"{category.upper()}_{action.upper()}"
            if hasattr(cls, scope_name):
                result[action] = getattr(cls, scope_name)

        return result


# Legacy dictionary for backward compatibility
# This maintains the original SCOPES dictionary structure
SCOPES = {scope: scope for scope in Scopes.all_scopes()}

# Export all scope constants at module level for backward compatibility
# This allows imports like: from papermerge.core.features.auth import scopes
# And usage like: scopes.NODE_VIEW, scopes.USER_CREATE, etc.
_scope_attrs = [attr for attr in dir(Scopes) if not attr.startswith('_') and not callable(getattr(Scopes, attr))]
for _attr in _scope_attrs:
    globals()[_attr] = getattr(Scopes, _attr)
