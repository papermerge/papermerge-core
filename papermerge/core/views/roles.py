from rest_framework import generics
from rest_framework.renderers import BrowsableAPIRenderer

from papermerge.core.rest.serializers import RoleSerializer
from papermerge.core.rest.renderers import JSONRenderer
from papermerge.core.rest.parsers import JSONParser
from papermerge.core.models import Role


class RolesList(generics.ListCreateAPIView):
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    queryset = Role.objects.all()
    serializer_class = RoleSerializer


class RoleDetail(generics.RetrieveUpdateDestroyAPIView):
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
