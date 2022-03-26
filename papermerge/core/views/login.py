from django.contrib.auth import login

from rest_framework import permissions
from rest_framework.renderers import JSONRenderer
from rest_framework.authtoken.serializers import AuthTokenSerializer
from knox.views import LoginView as KnoxLoginView

from .mixins import GetClassSerializerMixin


class LoginView(KnoxLoginView, GetClassSerializerMixin):
    permission_classes = (permissions.AllowAny,)
    renderer_classes = (JSONRenderer,)
    class_serializer = AuthTokenSerializer

    def post(self, request, format=None):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return super(LoginView, self).post(request, format=None)
