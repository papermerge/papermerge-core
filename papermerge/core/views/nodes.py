import logging
import magic

from django.http import (
    HttpResponseForbidden,
    Http404,
    HttpResponse
)
from django.http import FileResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.utils.translation import gettext as _
from django.core.files.temp import NamedTemporaryFile

from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from rest_framework_json_api.views import ModelViewSet
from rest_framework import status

from papermerge.core.serializers import (
    NodeSerializer,
    NodeMoveSerializer,
    NodesDownloadSerializer
)
from papermerge.core.tasks import nodes_move
from papermerge.core.models import (
    BaseTreeNode,
    Document,
    Access
)

from papermerge.core.backup_restore import build_tar_archive
from papermerge.core.storage import default_storage
from papermerge.core.nodes_download_file import NodesDownloadFile

from .mixins import RequireAuthMixin

logger = logging.getLogger(__name__)


PER_PAGE = 30


class NodesViewSet(RequireAuthMixin, ModelViewSet):
    """GET|POST /nodes/{id}/"""
    serializer_class = NodeSerializer
    queryset = BaseTreeNode.objects.all()

    def retrieve(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_queryset(self, *args, **kwargs):
        return BaseTreeNode.objects.filter(
            parent_id=self.kwargs['pk'],
            user=self.request.user
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.pk)


class NodesMoveView(RequireAuthMixin, GenericAPIView):
    """POST /nodes/move/"""
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


class NodesDownloadView(RequireAuthMixin, GenericAPIView):
    """GET /nodes/download/"""
    parser_classes = [JSONParser]
    serializer_class = NodesDownloadSerializer

    def get(self, request):
        serializer = NodesDownloadSerializer(data=request.query_params)
        if serializer.is_valid():
            try:
                download = NodesDownloadFile(**serializer.data)
                response = FileResponse(download.file_handle)
            except Document.DoesNotExist as exc:
                raise Http404 from exc

            return response
        else:
            return Response(
                serializer.errors,
                content_type='application/json',
                status=status.HTTP_400_BAD_REQUEST
            )


@login_required
def node_download(request, id, version=0):
    """
    Any user with read permission on the node must be
    able to download it.

    Node is either documennt or a folder.
    """
    try:
        node = BaseTreeNode.objects.get(id=id)
    except BaseTreeNode.DoesNotExist:
        raise Http404("Node does not exists")

    if request.user.has_perm(Access.PERM_READ, node):

        if node.is_document():
            file_abs_path = default_storage.abspath(
                node.path().url(version=version)
            )
            mime_type = magic.from_file(file_abs_path, mime=True)
            try:
                file_handle = open(file_abs_path, "rb")
            except OSError:
                logger.error(
                    "Cannot open local version of %s" % node.path.url()
                )
                return redirect('admin:browse')

            resp = HttpResponse(
                file_handle.read(),
                content_type=mime_type
            )
            disposition = "attachment; filename=%s" % node.title
            resp['Content-Disposition'] = disposition
            file_handle.close()

            return resp
        else:  # node is a folder

            with NamedTemporaryFile(prefix="download_") as fileobj:
                # collected into an archive all direct children of
                # selected folder
                node_ids = [_node.id for _node in node.get_children()]
                build_tar_archive(
                    fileobj=fileobj,
                    node_ids=node_ids
                )
                # reset fileobj to initial position
                fileobj.seek(0)
                data = fileobj.read()
                resp = HttpResponse(
                    data,
                    content_type="application/x-tar"
                )
                disposition = f"attachment; filename={node.title}.tar"
                resp['Content-Disposition'] = disposition

                return resp

    return HttpResponseForbidden()


@login_required
def nodes_download(request):
    """
    Download multiple nodes (documents and folders) packed
    as tar.gz archive.
    """

    node_ids = request.GET.getlist('node_ids[]')
    nodes = BaseTreeNode.objects.filter(
        id__in=node_ids
    )
    nodes_perms = request.user.get_perms_dict(
        nodes, Access.ALL_PERMS
    )
    for node in nodes:
        if not nodes_perms[node.id].get(
            Access.PERM_READ, False
        ):
            msg = _(
                "%s does not have permission to read %s"
            ) % (request.user.username, node.title)

            return msg, HttpResponseForbidden.status_code

    with NamedTemporaryFile(prefix="download_") as fileobj:
        build_tar_archive(
            fileobj=fileobj,
            node_ids=node_ids
        )
        # reset fileobj to initial position
        fileobj.seek(0)
        data = fileobj.read()
        resp = HttpResponse(
            data,
            content_type="application/x-tar"
        )
        disposition = "attachment; filename=download.tar"
        resp['Content-Disposition'] = disposition

        return resp
