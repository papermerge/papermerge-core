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
from .folders import FoldersViewSet
from .document_version import DocumentVersionsViewSet
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
    'DocumentVersionsViewSet',
    'FoldersViewSet',
    'UsersViewSet',
    'UserChangePassword',
    'CurrentUserView',
    'PagesViewSet',
    'OCRView'
]
