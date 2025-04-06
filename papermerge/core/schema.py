from .features.nodes.schema import Folder, NewFolder, Node, UpdateNode, MoveNode
from .features.shared_nodes.schema import (
    CreateSharedNode,
    SharedNode,
    SharedNodeAccessDetails
)
from .features.document.schema import (
    Document,
    NewDocument,
    DocumentVersion,
    Page,
    MovePage,
    CFV,
    DocumentCustomFieldsUpdate,
    DocumentCFV,
    ExtractPagesIn,
    ExtractPagesOut,
    PageAndRotOp,
    MovePagesIn,
    MovePagesOut,
    ExtractStrategy,
    MoveStrategy
)
from .features.users.schema import User, CreateUser, UserDetails, UpdateUser, ChangeUserPassword, UserHomes, UserInboxes, UserHome, UserInbox
from .features.custom_fields.schema import CustomField, UpdateCustomField, CustomFieldType, CustomFieldValue
from .features.tags.schema import Tag, UpdateTag, CreateTag
from .features.document_types.schema import DocumentType, UpdateDocumentType, CreateDocumentType
from .features.groups.schema import Group, GroupDetails, CreateGroup, UpdateGroup
from .features.roles.schema import Role, RoleDetails, CreateRole, UpdateRole, Permission
from .schemas.error import Error, AttrError
from .schemas.common import PaginatedResponse

__all__ = [
    'Folder',
    'NewFolder',
    'Node',
    'UpdateNode',
    'MoveNode',
    'Document',
    'NewDocument',
    'DocumentVersion',
    'Page',
    'MovePage',
    'User',
    'CreateUser',
    'UpdateUser',
    'UserDetails',
    'ChangeUserPassword',
    'UserHomes',
    'UserHome',
    'UserInboxes',
    'UserInbox',
    'Tag',
    'UpdateTag',
    'CreateTag',
    'Error',
    'AttrError',
    'CustomField',
    'UpdateCustomField',
    'CustomFieldType',
    'CustomFieldValue',
    'DocumentCFV',
    'CFV',
    'DocumentCustomFieldsUpdate',
    'ExtractPagesIn',
    'ExtractPagesOut',
    'PageAndRotOp',
    'MovePagesIn',
    'MovePagesOut',
    'ExtractStrategy',
    'MoveStrategy',
    'PaginatedResponse',
    'DocumentType',
    'CreateDocumentType',
    'UpdateDocumentType',
    'Group',
    'CreateGroup',
    'GroupDetails',
    'UpdateGroup',
    'Permission',
    'Role',
    'RoleDetails',
    'CreateRole',
    'UpdateRole',
    'CreateSharedNode',
    'SharedNode',
    'SharedNodeAccessDetails'
]
