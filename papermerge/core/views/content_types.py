from django.contrib.auth.models import ContentType
from rest_framework import generics

from papermerge.core.serializers import ContentTypeSerializer


class ContentTypeRetrieve(generics.RetrieveAPIView):
    serializer_class = ContentTypeSerializer
    pagination_class = None
    queryset = ContentType.objects.all()
