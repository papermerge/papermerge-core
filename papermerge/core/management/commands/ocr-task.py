import uuid

from django.core.management.base import BaseCommand

from papermerge.core.models import Document
from papermerge.core.ocr.document import ocr_document
from papermerge.core.tasks import _post_ocr_document


class Command(BaseCommand):
    help = """
    Calls OCR document same way the `core.task.ocr_document_task`

    Handy management command to quickly check if
    OCRing works
    """

    def add_arguments(self, parser):
        parser.add_argument(
            'UUID',
            help="Document UUID to trigger OCR task on"
        )
        parser.add_argument(
            'lang',
            help="OCR language"
        )

    def handle(self, *args, **options):
        doc_id = options.get('UUID')
        lang = options.get('lang')
        doc = Document.objects.get(id=doc_id)
        last_version = doc.versions.last()
        target_docver_uuid = uuid.uuid4()
        target_page_uuids = [
            uuid.uuid4() for _ in range(last_version.pages.count())
        ]

        ocr_document(
            lang=lang,
            document_version=last_version,
            target_docver_uuid=target_docver_uuid,
            target_page_uuids=target_page_uuids
        )
        _post_ocr_document(
            doc_id,
            target_docver_uuid=target_docver_uuid,
            target_page_uuids=target_page_uuids,
            lang=lang
        )
