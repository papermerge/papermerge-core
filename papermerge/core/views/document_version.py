from django.http import Http404

from rest_framework.generics import get_object_or_404
from rest_framework_json_api.views import ModelViewSet
from rest_framework.response import Response
from rest_framework import status

from papermerge.core.serializers import DocumentVersionSerializer
from papermerge.core.models import DocumentVersion, Document
from .mixins import RequireAuthMixin


class DocumentVersionsViewSet(RequireAuthMixin, ModelViewSet):
    serializer_class = DocumentVersionSerializer

    def get_queryset(self, *args, **kwargs):
        return DocumentVersion.objects.filter(document__user=self.request.user)

    def get_object(self):
        """
        Retrieves `DocumentVersion` instance based on `pk` of the `Document`

        Besides `pk` of the document, takes also into account
        the `version` parameter (i.e. self.kwargs['version']) which
        corresponds to `DocumentVersion.number` attribute.
        If `version` parameter is not specified, will return the
        last version of the document.
        """
        queryset = self.filter_queryset(self.get_queryset())
        pk = self.kwargs['pk']
        version_number = self.request.query_params.get('version', None)

        if version_number:
            obj = get_object_or_404(
                queryset,
                document__pk=pk,
                number=version_number
            )
        else:
            obj = queryset.filter(document__pk=pk).order_by('number').last()
            if not obj:
                raise Http404

        # May raise a permission denied
        self.check_object_permissions(self.request, obj)

        return obj

    def destroy(self, request, *args, **kwargs):
        """
        There is no such thing as delete document version, instead entire
        document is deleted!
        """
        instance = get_object_or_404(
            Document.objects,
            pk=self.kwargs['pk']
        )
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
