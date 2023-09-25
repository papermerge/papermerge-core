
from django.core.management.base import BaseCommand

from papermerge.core.models import Document
from papermerge.core.ocr.document import ocr_document
from papermerge.core.tasks import _post_ocr_document


class Command(BaseCommand):
    help = """
    Calls OCR document same was task is triggering it.

    Handy management command to quickly check if
    OCRing works
    """

    def add_arguments(self, parser):
        parser.add_argument(
            'UUID',
            help="Document UUID to trigger OCR task on"
        )

    def handle(self, *args, **options):
        uuid = options.get('UUID')
        doc = Document.objects.get(id=uuid)
        last_version = doc.versions.last()
        target_docver_uuid = uuid.uuid4()
        target_page_uuids = [
            uuid.uuid4() for _ in range(last_version.pages.count())
        ]

        ocr_document(
            lang=doc.lang,
            document_version=last_version,
            target_docver_uuid=target_docver_uuid,
            target_page_uuids=target_page_uuids
        )
        _post_ocr_document(
            uuid,
            target_docver_uuid=target_docver_uuid,
            target_page_uuids=target_page_uuids
        )
