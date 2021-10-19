from .automates import (AutomatesList, AutomateDetail)
from .content_types import ContentTypeRetrieve
from .tags import TagsViewSet
from .roles import RolesViewSet
from .groups import GroupsViewSet
from .permissions import PermissionsList


__all__ = [
    'AutomatesList',
    'AutomateDetail',
    'ContentTypeRetrieve',
    'TagsViewSet',
    'RolesViewSet',
    'GroupsViewSet',
    'PermissionsList',
]
