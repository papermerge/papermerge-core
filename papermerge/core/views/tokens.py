from datetime import timedelta

from rest_framework import status
from rest_framework.response import Response
from knox.models import AuthToken
from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import (
    TokenSerializer,
    CreateTokenSerializer,
)
from .mixins import RequireAuthMixin


class TokensViewSet(RequireAuthMixin, ModelViewSet):
    queryset = AuthToken.objects.all()
    serializer_class = TokenSerializer

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
