from django.contrib.auth import login

from rest_framework import permissions
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from rest_framework.authtoken.serializers import AuthTokenSerializer
from drf_spectacular.utils import extend_schema
from knox.views import LoginView as KnoxLoginView

from .mixins import GetClassSerializerMixin


@extend_schema(
    operation_id="Login/Authenticate"
)
class LoginView(KnoxLoginView, GetClassSerializerMixin):
    """
    Authenticates user with given username and password.
    Response will contain token to be used as part of ``Authorization`` header
    in subsequent requests whenever authorization is required.
    """
    permission_classes = (permissions.AllowAny,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)
    class_serializer = AuthTokenSerializer

    def post(self, request, format=None):
        serializer = AuthTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return super(LoginView, self).post(request, format=None)
