from django.contrib.auth.models import Permission
from rest_framework import generics
from rest_framework.renderers import BrowsableAPIRenderer

from papermerge.core.rest.serializers import PermissionSerializer
from papermerge.core.rest.renderers import JSONRenderer
from papermerge.core.rest.parsers import JSONParser


class PermissionsList(generics.ListCreateAPIView):
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
