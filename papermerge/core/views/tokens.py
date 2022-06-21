from datetime import timedelta

from rest_framework import status
from rest_framework.response import Response
from knox.models import AuthToken
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.renderers import JSONRenderer
from papermerge.core.serializers import (
    TokenSerializer,
    CreateTokenSerializer,
)
from papermerge.core.auth import CustomModelPermissions

from .mixins import RequireAuthMixin


class TokensViewSet(RequireAuthMixin, ModelViewSet):
    """
    Each user can have multiple authentication tokens. The reason to have
    multiple tokens per user is that he (or she) may consume REST API from
    multiple clients (or devices) using one single user account.
    User may then use a separate authentication token per each device or client.
    """
    queryset = AuthToken.objects.all()
    serializer_class = TokenSerializer
    renderer_classes = (JSONRenderer,)
    permission_classes = [CustomModelPermissions]

    http_method_names = ["get", "post", "delete", "head", "options"]

    def perform_create(self, serializer):
        return AuthToken.objects.create(
            user=self.request.user,
            expiry=timedelta(hours=serializer.data['expiry_hours'])
        )

    def create(self, request, *args, **kwargs):
        serializer = CreateTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instance, token = self.perform_create(serializer)
        authtoken_serializer = TokenSerializer(instance)
        headers = self.get_success_headers(authtoken_serializer.data)
        data = authtoken_serializer.data
        # return to user verbatim token only once - when token
        # was created
        data['token'] = token

        return Response(
            data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
