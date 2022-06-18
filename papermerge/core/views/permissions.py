from django.contrib.auth.models import Permission

from rest_framework import generics
from rest_framework_json_api.renderers import JSONRenderer as JSONAPIRenderer

from papermerge.core.serializers import PermissionSerializer
from papermerge.core.auth import CustomModelPermissions
from .mixins import RequireAuthMixin


class PermissionsList(RequireAuthMixin, generics.ListAPIView):
    serializer_class = PermissionSerializer
    renderer_classes = (JSONAPIRenderer, )
    permission_classes = [CustomModelPermissions]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        """
        Retrieves (almost) ALL permissions available in the system.

        It is useful to be able to retrieve (almost) ALL permission resource
        objects available - for example when creating a new Role you need to
        know what permissions are available and then select couple of available
        permissions and associate them to the newly create Role.

        Some permissions available will never be returned by this endpoint
        (hence "almost all").
        For example permissions for internally used 'BaseTreeNode' model.
        User is not aware what is 'BaseTreeNode' and getting permission
        for that will only confuse him/her. Permissions used to grant access
        per node/object are not returned either.

        In order to access this endpoint
        you need **view_permission** permission.

        Don't confuse this endpoint with "user permissions", which is intended,
        as name suggests, to return only user specific permissions.
        In order to retrieve current user permissions use
        /api/users/me/ endpoint.
        """
        return self.list(request, *args, **kwargs)

    def get_queryset(self):
        """
        Returns a queryset of permissions which makes sense
        to display (e.g. when creating a new Role).
        For example, it does not make sense to
        show permissions for BaseTreeNode model - user is not
        even aware of what is it (and should not be).
        """
        qs = Permission.objects.filter(
            content_type__model__in=[
                "user", "role", "group", "permission", "access",
                "authtoken", "session", "document",
                "folder", "userpreferencemodel", "automate"
            ]
        ).exclude(
            # exclude per node permissions,
            # i.e. permissions set on folder/document
            # instance (defined and
            # used in ``papermerge.core.access`` module)
            codename__in=[
                "read", "write", "delete", "change_perm", "take_ownership"
            ]
        )

        return qs
