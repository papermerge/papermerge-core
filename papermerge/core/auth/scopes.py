NODE_CREATE = 'node.create'
NODE_VIEW = 'node.view'
NODE_UPDATE = 'node.update'
NODE_DELETE = 'node.delete'
NODE_MOVE = 'node.move'
DOCUMENT_UPLOAD = 'document.upload'
DOCUMENT_DOWNLOAD = 'document.download'
TAG_CREATE = 'tag.create'
TAG_VIEW = 'tag.view'
TAG_UPDATE = 'tag.update'
TAG_DELETE = 'tag.delete'
USER_CREATE = 'user.create'
USER_VIEW = 'user.view'
USER_UPDATE = 'user.update'
USER_DELETE = 'user.delete'
USER_ME = 'user.me'
GROUP_CREATE = 'group.create'
GROUP_VIEW = 'group.view'
GROUP_UPDATE = 'group.update'
GROUP_DELETE = 'group.delete'
TASK_OCR = 'task.ocr'
OCRLANG_VIEW = 'ocrlang.view'
PAGE_VIEW = 'page.view'
PAGE_UPDATE = 'page.update'
PAGE_MOVE = 'page.move'
PAGE_EXTRACT = 'page.extract'

SCOPES = {
    NODE_CREATE: "Create folders",
    NODE_VIEW: "View nodes",
    NODE_UPDATE: "Update nodes",
    NODE_DELETE: "Delete nodes",
    NODE_MOVE: "Move nodes",
    DOCUMENT_UPLOAD: "Upload documents",
    DOCUMENT_DOWNLOAD: "Download documents",
    TASK_OCR: "Perform OCR operation of the documents",
    TAG_CREATE: "Create tags",
    TAG_VIEW: "View tags",
    TAG_UPDATE: "Update tags",
    TAG_DELETE: "Delete tags",
    USER_ME: "Read information about the current user",
    USER_CREATE: "Create users",
    USER_VIEW: "View users",
    USER_UPDATE: "Update users",
    USER_DELETE: "Delete users",
    GROUP_CREATE: "Create groups",
    GROUP_VIEW: "View groups",
    GROUP_UPDATE: "Update groups",
    GROUP_DELETE: "Delete groups",
    OCRLANG_VIEW: "View OCR languages",
    PAGE_VIEW: "View document page",
    PAGE_UPDATE: "Update pages e.g. rotate, reorder within the document",
    PAGE_MOVE: "Move pages from one document to another",
    PAGE_EXTRACT: "Extract pages",
}
