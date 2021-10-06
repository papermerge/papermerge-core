from django.contrib.auth.models import Group
from rest_framework import generics
from rest_framework.renderers import BrowsableAPIRenderer

from papermerge.core.rest.serializers import GroupSerializer
from papermerge.core.rest.renderers import JSONRenderer
from papermerge.core.rest.parsers import JSONParser


class GroupsList(generics.ListCreateAPIView):
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


class GroupDetail(generics.RetrieveUpdateDestroyAPIView):
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
