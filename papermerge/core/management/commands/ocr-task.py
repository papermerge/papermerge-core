from django.core.management.base import BaseCommand

from papermerge.core.models import Document
from papermerge.core.tasks import ocr_document_task


class Command(BaseCommand):
    help = """
    Triggers OCR task for given document UUID
    """

    def add_arguments(self, parser):
        parser.add_argument(
            'UUID',
            help="Document UUID to trigger OCR task on"
        )

    def handle(self, *args, **options):
        uuid = options.get('UUID')
        doc = Document.objects.get(id=uuid)

        ocr_document_task.apply_async(
            kwargs={
                'document_id': str(doc.id),
                'lang': doc.lang,
                'namespace': None,
                'user_id': str(doc.user.id)
            }
        )
