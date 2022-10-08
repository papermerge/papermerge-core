import logging

from django.http import (
    Http404,
    HttpResponse
)
from rest_framework.generics import (
    GenericAPIView,
    CreateAPIView,
    UpdateAPIView,
    DestroyAPIView
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from rest_framework.renderers import JSONRenderer
from rest_framework_json_api.views import ModelViewSet
from rest_framework_json_api.parsers import JSONParser as JSONAPIParser
from rest_framework_json_api.renderers import JSONRenderer as JSONAPIRenderer
from rest_framework import status

from drf_spectacular.utils import extend_schema

from papermerge.core.serializers import (
    NodeSerializer,
    NodeMoveSerializer,
    NodesDownloadSerializer,
    NodeTagsSerializer,
    InboxCountSerializer
)

from papermerge.core.models import (
    BaseTreeNode,
    Document,
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
    parser_classes = [JSONAPIParser]
    renderer_classes = [JSONAPIRenderer]
    queryset = BaseTreeNode.objects.all()
    # object level permissions
    access_object_permissions = {
        'retrieve': "read",
        'update': "write",
        'delete': "delete"
    }

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

    def create(self, request, *args, **kwargs):
        """
        Creates a node.

        A node can be either a Folder or a Document. In order to create
        a folder set required `type` attribute to `folders`. In order
        to create a document set `type` attribute to `documents`.

        Created document won't have any file associated i.e. this REST API
        creates just document model in database.
        """
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.pk)


class NodesMoveView(RequireAuthMixin, GenericAPIView):
    parser_classes = [JSONParser]
    serializer_class = NodeMoveSerializer

    def post(self, request):
        serializer = NodeMoveSerializer(data=request.data)
        if serializer.is_valid():
            self._move_nodes(
                nodes=serializer.data['nodes'],
                target_parent_id=serializer.data['target_parent']['id']
            )
            return Response()
        else:
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

    def _move_nodes(self, nodes, target_parent_id):
        try:
            target_model = BaseTreeNode.objects.get(pk=target_parent_id)
        except BaseTreeNode.DoesNotExist as exc:
            logger.error(exc, exc_info=True)
            return

        for node in nodes:
            try:
                node_model = BaseTreeNode.objects.get(pk=node['id'])
            except BaseTreeNode.DoesNotExist as exc:
                logger.error(exc, exc_info=True)

            node_model.refresh_from_db()  # this may take a while
            target_model.refresh_from_db()  # may take a while
            Document.objects.move_node(node_model, target_model)


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


class NodeTagsView(
    RequireAuthMixin,
    CreateAPIView,
    UpdateAPIView,
    DestroyAPIView

):
    parser_classes = [JSONParser]
    renderer_classes = [JSONRenderer]
    serializer_class = NodeTagsSerializer
    pagination_class = None

    http_method_names = [
        'head',
        'post',
        'patch',
        'delete'
    ]

    def get_object(self):
        try:
            node = BaseTreeNode.objects.get(pk=self.kwargs['pk'])
        except BaseTreeNode.DoesNotExist as e:
            raise Http404("Node does not exist") from e

        return node

    @extend_schema(operation_id="node_assign_tags")
    def post(self, request, *args, **kwargs):
        """
        Assigns given list of tag names to the node.

        All tags not present in given list of tags names
        will be disassociated from the node; in other words upon
        successful completion of the request node will have ONLY
        tags from the list.
        Yet another way of thinking about http POST is as it **replaces
        existing node tags** with the one from input list.

        Example:

            Node N1 has 'invoice', 'important', 'unpaid' tags.

            After following request:

                POST /api/nodes/{N1}/tags/
                {tags: ['invoice', 'important', 'paid']}

            Node N1 will have 'invoice', 'important', 'paid' tags.
            Notice that previously associated 'unpaid' tag is not
            assigned to N1 anymore (because it was not in the provided list
            of tags).

        If you want to retain node tags not present in input tag list names
        then use PATCH/PUT http method of this endpoint.
        """
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        node = self.get_object()
        node.tags.set(
            serializer.data['tags'],
            tag_kwargs={"user": self.request.user}
        )

    @extend_schema(operation_id="node_append_tags")
    def patch(self, request, *args, **kwargs):
        """
        Appends given list of tag names to the node.

        Retains all previously associated node tags.
        Yet another way of thinking about http PATCH method is as it
        **appends** input tags to the currently associated tags.

        Example:

            Node N1 has 'invoice', 'important' tags.

            After following request:

                POST /api/nodes/{N1}/tags/
                {tags: ['paid']}

            Node N1 will have 'invoice', 'important', 'paid' tags.
            Notice that previously associated 'invoice' and 'important' tags
            are still assigned to N1.
        """
        return super().patch(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        node = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        node.tags.add(
            *serializer.data['tags'],
            tag_kwargs={"user": self.request.user}
        )

        return Response(serializer.data)

    @extend_schema(operation_id="node_dissociate_tags")
    def delete(self, request, *args, **kwargs):
        """
        Dissociate given tags the node.

        Tags models are not deleted - just dissociated from the node.
        """
        return self.destroy(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        node = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        node.tags.remove(*serializer.data['tags'])

        return Response(status=status.HTTP_204_NO_CONTENT)
