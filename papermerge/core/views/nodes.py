import logging

from collections import OrderedDict

from django.http import (
    Http404,
    HttpResponse
)
from django.db.models.signals import post_save
from django.utils import encoding
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
from rest_framework.serializers import ListSerializer
from rest_framework.settings import api_settings
from rest_framework import relations

from rest_framework_json_api import utils


from drf_spectacular.utils import (
    extend_schema,
    OpenApiTypes
)

from papermerge.core.serializers.node import Data_NodeSerializer
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
from papermerge.core.models.node import move_node

from papermerge.core.nodes_download import get_nodes_download

from .mixins import RequireAuthMixin, GetClassSerializerMixin

logger = logging.getLogger(__name__)


PER_PAGE = 30


class JSONAPIPolymorphicRenderer(JSONAPIRenderer):
    @classmethod
    def build_json_resource_obj(
        cls,
        fields,
        resource,
        resource_instance,
        resource_name,
        serializer,
        force_type_resolution=False,
    ):
        """
        When building JSON obj force correct node type! UGLY!
        """
        if resource_instance.is_folder:
            resource_name = "folders"
        else:
            resource_name = "documents"

        if resource_instance:
            resource_id = encoding.force_str(resource_instance.pk)
        else:
            resource_id = None

        resource_data = [
            ("type", resource_name),
            (
                "id",
                resource_id,
            ),
            ("attributes", cls.extract_attributes(fields, resource)),
        ]
        relationships = cls.extract_relationships(
            fields,
            resource,
            resource_instance
        )
        if relationships:
            relationships['parent']['data']['type'] = 'folders'  # UGLY!
            resource_data.append(("relationships", relationships))
        # Add 'self' link if field is present and valid
        if api_settings.URL_FIELD_NAME in resource and isinstance(
            fields[api_settings.URL_FIELD_NAME], relations.RelatedField
        ):
            resource_data.append(
                ("links", {"self": resource[api_settings.URL_FIELD_NAME]})
            )

        meta = cls.extract_meta(serializer, resource)
        if meta:
            resource_data.append(("meta", utils.format_field_names(meta)))

        return OrderedDict(resource_data)


class NodesViewSet(RequireAuthMixin, ModelViewSet):
    """
    Documents can be organized in folders. One folder can contain documents as
    well as other folders. A node is a convinient abstraction of two concepts -
    'folder' and 'document'. Each node has a type field with value either
    'folders' or 'documents' depending on what kind of node it is.
    """
    serializer_class = NodeSerializer
    parser_classes = [JSONAPIParser]
    renderer_classes = [JSONAPIPolymorphicRenderer]
    queryset = BaseTreeNode.objects.all()
    # object level permissions
    access_object_permissions = {
        'retrieve': "read",
        'update': "write",
        'delete': "delete"
    }

    @extend_schema(
        operation_id="node_retrieve",
        responses={
            200: ListSerializer(child=NodeSerializer())
        }
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

    @extend_schema(
        request=Data_NodeSerializer(),
        responses={
            201: Data_NodeSerializer(),
            400: {
                'type': 'object',
                'properties': {
                    'errors': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'detail': {
                                    'type': 'string'
                                },
                                'status': {
                                    'type': 'string'
                                },
                                'code': {
                                    'type': 'string'
                                },
                                'source': {
                                    'type': 'object',
                                    'properties': {
                                        'pointer': {
                                            'type': 'string'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    )
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

            move_node(node_model, target_model)


class InboxCountView(RequireAuthMixin, APIView, GetClassSerializerMixin):
    parser_classes = [JSONParser]
    class_serializer = InboxCountSerializer

    def get(self, request):
        inbox_folder = request.user.inbox_folder
        return Response({
            'count': inbox_folder.get_children().count()
        })


class NodesDownloadView(RequireAuthMixin, GenericAPIView):
    """GET /nodes/download/"""
    parser_classes = [JSONParser]
    serializer_class = NodesDownloadSerializer

    @extend_schema(
        operation_id="nodes_download",
        responses={
            (200, 'application/pdf'): OpenApiTypes.BINARY,
            (200, 'application/zip'): OpenApiTypes.BINARY,
            (200, 'application/x-gtar'): OpenApiTypes.BINARY
        },
        parameters=[
            NodesDownloadSerializer
        ]
    )
    def get(self, request):
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
        ret = super().post(request, *args, **kwargs)
        # As the post_save signal is not sent automatically
        # send it manually. This signal is handled by
        # papermerge.search app in order to update the search
        # index
        post_save.send(
            sender=BaseTreeNode,
            instance=self.get_object(),
            created=False
        )
        return ret

    def perform_create(self, serializer):
        node = self.get_object().folder_or_document
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
        node = self.get_object().folder_or_document

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
        node = self.get_object().document_or_folder
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        node.tags.remove(*serializer.data['tags'])

        return Response(status=status.HTTP_204_NO_CONTENT)
