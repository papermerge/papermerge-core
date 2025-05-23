NODE_CREATE = "node.create"
NODE_VIEW = "node.view"
NODE_UPDATE = "node.update"
NODE_DELETE = "node.delete"
NODE_MOVE = "node.move"
DOCUMENT_UPLOAD = "document.upload"
DOCUMENT_DOWNLOAD = "document.download"
# user can pick up a tag from dropdown menu
# e.g. for sharing folders and documents
TAG_SELECT = "tag.select"
TAG_CREATE = "tag.create"
TAG_VIEW = "tag.view"
TAG_UPDATE = "tag.update"
TAG_DELETE = "tag.delete"
USER_CREATE = "user.create"
# user can pick up a user from dropdown menu
# e.g. for sharing folders and documents
USER_SELECT = "user.select"
USER_VIEW = "user.view"
USER_UPDATE = "user.update"
USER_DELETE = "user.delete"
USER_ME = "user.me"
GROUP_CREATE = "group.create"
# user can pick up a group from dropdown menu
# e.g. for sharing folders and documents
GROUP_SELECT = "group.select"
GROUP_VIEW = "group.view"
GROUP_UPDATE = "group.update"
GROUP_DELETE = "group.delete"
ROLE_CREATE = "role.create"
ROLE_VIEW = "role.view"
# user can pick up a role from dropdown menu
# e.g. for sharing folders and documents
ROLE_SELECT = "role.select"
ROLE_UPDATE = "role.update"
ROLE_DELETE = "role.delete"
TASK_OCR = "task.ocr"
OCRLANG_VIEW = "ocrlang.view"
PAGE_VIEW = "page.view"
PAGE_UPDATE = "page.update"
PAGE_MOVE = "page.move"
PAGE_EXTRACT = "page.extract"
PAGE_DELETE = "page.delete"
CUSTOM_FIELD_CREATE = "custom_field.create"
CUSTOM_FIELD_VIEW = "custom_field.view"
CUSTOM_FIELD_UPDATE = "custom_field.update"
CUSTOM_FIELD_DELETE = "custom_field.delete"
DOCUMENT_TYPE_CREATE = "document_type.create"
DOCUMENT_TYPE_VIEW = "document_type.view"
DOCUMENT_TYPE_UPDATE = "document_type.update"
DOCUMENT_TYPE_DELETE = "document_type.delete"
SHARED_NODE_CREATE = "shared_node.create"
SHARED_NODE_VIEW = "shared_node.view"
SHARED_NODE_UPDATE = "shared_node.update"
SHARED_NODE_DELETE = "shared_node.delete"

SCOPES = {
    NODE_CREATE: NODE_CREATE,
    NODE_VIEW: NODE_VIEW,
    NODE_UPDATE: NODE_UPDATE,
    NODE_DELETE: NODE_DELETE,
    NODE_MOVE: NODE_MOVE,
    DOCUMENT_UPLOAD: DOCUMENT_UPLOAD,
    DOCUMENT_DOWNLOAD: DOCUMENT_DOWNLOAD,
    TASK_OCR: TASK_OCR,
    TAG_CREATE: TAG_CREATE,
    TAG_VIEW: TAG_VIEW,
    TAG_SELECT: TAG_SELECT,
    TAG_UPDATE: TAG_UPDATE,
    TAG_DELETE: TAG_DELETE,
    USER_ME: USER_ME,
    USER_CREATE: USER_CREATE,
    USER_VIEW: USER_VIEW,
    USER_SELECT: USER_SELECT,
    USER_UPDATE: USER_UPDATE,
    USER_DELETE: USER_DELETE,
    GROUP_CREATE: GROUP_CREATE,
    GROUP_VIEW: GROUP_VIEW,
    GROUP_SELECT: GROUP_SELECT,
    GROUP_UPDATE: GROUP_UPDATE,
    GROUP_DELETE: GROUP_DELETE,
    ROLE_CREATE: ROLE_CREATE,
    ROLE_VIEW: ROLE_VIEW,
    ROLE_SELECT: ROLE_SELECT,
    ROLE_UPDATE: ROLE_UPDATE,
    ROLE_DELETE: ROLE_DELETE,
    OCRLANG_VIEW: OCRLANG_VIEW,
    PAGE_VIEW: PAGE_VIEW,
    PAGE_UPDATE: PAGE_UPDATE,
    PAGE_MOVE: PAGE_MOVE,
    PAGE_EXTRACT: PAGE_EXTRACT,
    PAGE_DELETE: PAGE_DELETE,
    CUSTOM_FIELD_CREATE: CUSTOM_FIELD_CREATE,
    CUSTOM_FIELD_VIEW: CUSTOM_FIELD_VIEW,
    CUSTOM_FIELD_UPDATE: CUSTOM_FIELD_UPDATE,
    CUSTOM_FIELD_DELETE: CUSTOM_FIELD_DELETE,
    DOCUMENT_TYPE_CREATE: DOCUMENT_TYPE_CREATE,
    DOCUMENT_TYPE_VIEW: DOCUMENT_TYPE_VIEW,
    DOCUMENT_TYPE_UPDATE: DOCUMENT_TYPE_UPDATE,
    DOCUMENT_TYPE_DELETE: DOCUMENT_TYPE_DELETE,
    SHARED_NODE_CREATE: SHARED_NODE_CREATE,
    SHARED_NODE_VIEW: SHARED_NODE_VIEW,
    SHARED_NODE_UPDATE: SHARED_NODE_UPDATE,
    SHARED_NODE_DELETE: SHARED_NODE_DELETE,
}
