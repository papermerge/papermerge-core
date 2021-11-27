from .automates import AutomatesViewSet
from .content_types import ContentTypeRetrieve
from .tags import TagsViewSet
from .roles import RolesViewSet
from .groups import GroupsViewSet
from .permissions import PermissionsList
from .users import (
    UsersViewSet,
    UserChangePassword,
    CurrentUserView
)
from .nodes import NodesViewSet
from .documents import DocumentUploadView
from .document_versions import DocumentVersionsDownloadView
from .documents import DocumentDetailsViewSet
from .folders import FoldersViewSet
from .pages import PagesViewSet
from .tasks import OCRView

__all__ = [
    'AutomatesViewSet',
    'ContentTypeRetrieve',
    'TagsViewSet',
    'RolesViewSet',
    'GroupsViewSet',
    'PermissionsList',
    'NodesViewSet',
    'DocumentUploadView',
    'DocumentVersionsDownloadView',
    'DocumentDetailsViewSet',
    'FoldersViewSet',
    'UsersViewSet',
    'UserChangePassword',
    'CurrentUserView',
    'PagesViewSet',
    'OCRView'
]
