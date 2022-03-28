from django.contrib.auth.models import ContentType
from rest_framework import generics
from drf_spectacular.utils import extend_schema

from papermerge.core.serializers import ContentTypeSerializer


@extend_schema(exclude=True)
class ContentTypeRetrieve(generics.RetrieveAPIView):
    serializer_class = ContentTypeSerializer
    pagination_class = None
    queryset = ContentType.objects.all()
