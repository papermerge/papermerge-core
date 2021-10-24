from django.contrib.auth.models import Permission
from rest_framework import generics

from papermerge.core.serializers import PermissionSerializer
from .mixins import RequireAuthMixin


class PermissionsList(RequireAuthMixin, generics.ListCreateAPIView):
    serializer_class = PermissionSerializer
    pagination_class = None

    def get_queryset(self):
        """
        Returns a queryset of permissions which makes sense
        to display. For example it does not make sense to
        show permissions for BaseTreeNode model - user is not
        even aware of what is it (and should not be).
        """
        qs = Permission.objects.filter(
            content_type__model__in=[
                "user", "role", "group", "access",
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
