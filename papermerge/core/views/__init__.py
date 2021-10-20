from .automates import AutomatesViewSet
from .content_types import ContentTypeRetrieve
from .tags import TagsViewSet
from .roles import RolesViewSet
from .groups import GroupsViewSet
from .permissions import PermissionsList
from .users import UsersViewSet


__all__ = [
    'AutomatesViewSet',
    'ContentTypeRetrieve',
    'TagsViewSet',
    'RolesViewSet',
    'GroupsViewSet',
    'PermissionsList',
    'UsersViewSet'
]
