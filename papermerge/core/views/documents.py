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
from papermerge.core.serializers import DocumentVersionSerializer
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


@login_required
def preview(request, id, step=None, page="1"):

    try:
        doc = Document.objects.get(id=id)
    except Document.DoesNotExist:
        raise Http404("Document does not exists")

    if request.user.has_perm(Access.PERM_READ, doc):
        version = request.GET.get('version', None)

        page_path = doc.get_page_path(
            page_num=page,
            step=Step(step),
            version=version
        )
        img_abs_path = default_storage.abspath(
            page_path.img_url()
        )

        if not os.path.exists(img_abs_path):
            logger.debug(
                f"Preview image {img_abs_path} does not exists. Generating..."
            )
            extract_img(
                page_path, media_root=settings.MEDIA_ROOT
            )

        try:
            with open(img_abs_path, "rb") as f:
                return HttpResponse(f.read(), content_type="image/jpeg")
        except IOError:
            generic_file = "admin/img/document.png"
            if Step(step).is_thumbnail:
                generic_file = "admin/img/document_thumbnail.png"

            file_path = finders.find(generic_file)

            with open(file_path, "rb") as f:
                return HttpResponse(f.read(), content_type="image/png")

    return HttpResponseForbidden()


@json_response
@login_required
def text_view(
    request,
    id,
    document_version,
    page_number
):

    try:
        page = Page.objects.get(
            document__id=id,
            number=page_number
        )
    except Page.DoesNotExist:
        raise Http404("Page does not exists")

    doc = page.document

    if request.user.has_perm(Access.PERM_READ, doc):
        txt_abs_path = default_storage.abspath(
            page.path(version=document_version).txt_url()
        )
        text = ""

        with open(txt_abs_path, "r") as f:
            text = f.read()

        return {
            'page_text': text,
            'page_number': page.number,
            'document_version': document_version
        }

    msg = _(
        "%s does not have read perissions on %s"
    ) % (request.user.username, doc.title)

    return msg, HttpResponseForbidden.status_code


@json_response
@login_required
@require_POST
def run_ocr_view(request):

    post_data = json.loads(request.body)
    node_ids = post_data['document_ids']
    new_lang = post_data['lang']

    documents = Document.objects.filter(
        id__in=node_ids
    )
    nodes_perms = request.user.get_perms_dict(
        documents, Access.ALL_PERMS
    )
    for node in documents:
        if not nodes_perms[node.id].get(
            Access.PERM_WRITE, False
        ):
            msg = _(
                "%s does not have write perission on %s"
            ) % (request.user.username, node.title)

            return msg, HttpResponseForbidden.status_code

    for doc in documents:
        old_version = doc.version
        new_version = doc.version + 1

        default_storage.copy_doc(
            src=doc.path(version=old_version),
            dst=doc.path(version=new_version)
        )
        ocr_document_task.apply_async(kwargs={
            'user_id': doc.user.id,
            'document_id': doc.id,
            'file_name': doc.file_name,
            'lang': new_lang,
            'namespace': getattr(default_storage, 'namespace', None),
            'version': new_version
        })

        doc.lang = new_lang
        doc.version = new_version
        doc.save()

    return {'msg': _("OCR process successfully started")}
