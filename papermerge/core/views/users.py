import logging

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

    def post(self, request, pk):
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


class CurrentUserView(RequireAuthMixin, GenericAPIView):
    resource_name = 'users'
    serializer_class = UserSerializer
    renderer_classes = (JSONAPIRenderer,)

    def get(self, request):
        serializer = UserSerializer(self.request.user)
        return Response(serializer.data)

    def get_queryset(self):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return User.objects.none()

        return super().get_queryset()
