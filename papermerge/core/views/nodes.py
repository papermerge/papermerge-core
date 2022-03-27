
import logging

from django.http import (
    Http404,
    HttpResponse
)
from rest_framework.generics import GenericAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from rest_framework_json_api.views import ModelViewSet
from rest_framework import status

from drf_spectacular.utils import extend_schema

from papermerge.core.serializers import (
    NodeSerializer,
    NodeMoveSerializer,
    NodesDownloadSerializer,
    InboxCountSerializer
)
from papermerge.core.tasks import nodes_move
from papermerge.core.models import (
    BaseTreeNode,
    Document
)

from papermerge.core.nodes_download import get_nodes_download

from .mixins import RequireAuthMixin, GetClassSerializerMixin

logger = logging.getLogger(__name__)


PER_PAGE = 30


class NodesViewSet(RequireAuthMixin, ModelViewSet):
    """
    Documents can be organized in folders. One folder can contain documents as
    well as other folders. A node is a convinient abstraction of two concepts -
    'folder' and 'document'. Each node has a type field with value either
    'folders' or 'documents' depending on what kind of node it is.
    """
    serializer_class = NodeSerializer
    queryset = BaseTreeNode.objects.all()

    @extend_schema(
        operation_id="Retrieve Node",
    )
    def retrieve(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self, *args, **kwargs):
        """
        Retrieves node's children.

        Node is specified with pk = kwargs['pk'].
        If no pk is provided, retrieves all top level nodes of current user i.e.
        all nodes (of current user) with parent_id=None.
        """
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return BaseTreeNode.objects.none()

        return BaseTreeNode.objects.filter(
            parent_id=self.kwargs.get('pk', None),
            user=self.request.user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.pk)


class NodesMoveView(RequireAuthMixin, GenericAPIView):
    parser_classes = [JSONParser]
    serializer_class = NodeMoveSerializer

    def post(self, request):
        serializer = NodeMoveSerializer(data=request.data)
        if serializer.is_valid():
            result = nodes_move.apply_async(
                kwargs={
                    'source_parent': serializer.data['source_parent'],
                    'target_parent': serializer.data['target_parent'],
                    'nodes': serializer.data['nodes']
                }
            )
            return Response({'task_id': result.id})
        else:
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )


class InboxCountView(RequireAuthMixin, APIView, GetClassSerializerMixin):
    parser_classes = [JSONParser]
    class_serializer = InboxCountSerializer

    def get(self, request):
        inbox_folder = request.user.inbox_folder
        return Response({
            'count': inbox_folder.get_descendants().count()
        })


class NodesDownloadView(RequireAuthMixin, GenericAPIView):
    """GET /nodes/download/"""
    parser_classes = [JSONParser]
    serializer_class = NodesDownloadSerializer

    def get(self, request):
        """
        Expects one or multiple of following HTTP GET parameters:
        * node_ids (required) - a list of node IDs to download
        * file_name - preferred file name for downloaded archive/document file
        * include_version = 'only_last' or 'only_original'
            In case when include_version == 'only_last', downloaded
            archive/document file(s) will contain only last version
            of the document
            Respectively for include_version == 'only_original' downloaded
            archive/document file(s) will contain only orignial version
            of the document
            Default value is 'only_last'
        * archive_type = 'zip' or 'targz'
            Applies only if there is more than one node to download.
            Decides on type of archive to create.
            Default value is 'zip'
        """
        serializer = NodesDownloadSerializer(data=request.query_params)
        if serializer.is_valid():
            try:
                nodes_download = get_nodes_download(**serializer.data)
            except Document.DoesNotExist as exc:
                raise Http404 from exc

            response = HttpResponse(
                nodes_download.get_content(),
                content_type=nodes_download.content_type
            )
            response['Content-Disposition'] = nodes_download.content_disposition

            return response
        else:
            return Response(
                serializer.errors,
                content_type='application/json',
                status=status.HTTP_400_BAD_REQUEST
            )

    def get_queryset(self):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return BaseTreeNode.objects.none()

        return super().get_queryset()
