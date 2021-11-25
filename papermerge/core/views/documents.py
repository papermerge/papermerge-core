import os
import json
import logging

from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST
from django.conf import settings

from django.http import (
    HttpResponse,
    HttpResponseRedirect,
    HttpResponseForbidden,
    Http404
)
from django.contrib.staticfiles import finders
from django.contrib.auth.decorators import login_required

from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.parsers import FileUploadParser
from rest_framework_json_api.views import ModelViewSet

from mglib.step import Step
from papermerge.core.lib.shortcuts import extract_img

from papermerge.core.storage import default_storage
from papermerge.core.serializers import DocumentDetailsSerializer
from .decorators import json_response

from papermerge.core.models import (
    Document,
    DocumentVersion,
    Page,
    Access
)
from papermerge.core.tasks import ocr_document_task

from .mixins import RequireAuthMixin


logger = logging.getLogger(__name__)


class DocumentUploadView(RequireAuthMixin, APIView):
    parser_classes = [FileUploadParser]

    def put(self, request, document_id, file_name):
        payload = request.data['file']

        doc = Document.objects.get(pk=document_id)
        doc.upload(payload=payload, file_name=file_name)

        return Response({}, status=status.HTTP_201_CREATED)


class DocumentDetailsViewSet(RequireAuthMixin, ModelViewSet):
    serializer_class = DocumentDetailsSerializer
    queryset = Document.objects


@login_required
def usersettings(request, option, value):

    if option == 'documents_view':
        user_settings = request.user.preferences
        if value in ('list', 'grid'):
            user_settings['views__documents_view'] = value
            user_settings['views__documents_view']

    return HttpResponseRedirect(
        request.META.get('HTTP_REFERER')
    )

