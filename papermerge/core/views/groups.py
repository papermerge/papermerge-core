from django.contrib.auth.models import Group
from rest_framework import generics
from rest_framework.renderers import BrowsableAPIRenderer

from papermerge.core.serializers import GroupSerializer
from papermerge.core.renderers.json import JSONRenderer


class GroupsList(generics.ListCreateAPIView):
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    queryset = Group.objects.all()
    serializer_class = GroupSerializer


class GroupDetail(generics.RetrieveUpdateDestroyAPIView):
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
