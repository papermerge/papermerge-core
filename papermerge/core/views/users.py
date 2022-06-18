import logging

from django.core.exceptions import PermissionDenied

from rest_framework.generics import GenericAPIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer as JSONAPIRenderer

from papermerge.core.serializers import (UserSerializer, PasswordSerializer)
from papermerge.core.models import User
from papermerge.core.auth import CustomModelPermissions
from .mixins import RequireAuthMixin

logger = logging.getLogger(__name__)


class UsersViewSet(RequireAuthMixin, ModelViewSet):
    """
    Users endpoint
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    renderer_classes = (JSONAPIRenderer,)
    permission_classes = [CustomModelPermissions]


class UserChangePassword(RequireAuthMixin, GenericAPIView):
    parser_classes = [JSONParser]
    renderer_classes = (JSONRenderer,)
    serializer_class = PasswordSerializer
    http_method_names = ['post', 'head', 'options']

    def post(self, request, pk):
        """
        Change password of the user identified with UUID/pk in the URL
        """
        if not self._has_perm(request, pk):
            raise PermissionDenied

        serializer = PasswordSerializer(data=request.data)
        user = User.objects.get(pk=pk)
        if serializer.is_valid():
            user.set_password(serializer.validated_data['password'])
            user.save()
            return Response({'status': 'password set'})
        else:
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

    def _has_perm(self, request, pk):
        """
        Does user have permission to perform 'change user password'?

        Same endpoint is used when changing other users password and your
        own user password. When changing own user password, user does not
        need to have 'change_user' permission.
        """
        if request.user.pk == pk:
            return True

        # here changing password for other users
        if request.user.has_perm('core.change_user'):
            return True


class CurrentUserView(RequireAuthMixin, GenericAPIView):
    resource_name = 'users'
    serializer_class = UserSerializer
    renderer_classes = (JSONAPIRenderer,)

    def get(self, request):
        """
        Retrieves current user details.

        Detailed information includes, among others, information about home
        folder, inbox folder and permission of the current user.

        Note that this endpoint returns user permissions i.e. what actions
        current user is authorized to perform.
        """
        serializer = UserSerializer(self.request.user)
        return Response(serializer.data)

    def get_queryset(self):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return User.objects.none()

        return super().get_queryset()
