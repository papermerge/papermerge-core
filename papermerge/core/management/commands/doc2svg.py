import logging
import ocrmypdf

from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = """
    Convert given a document (pdf, jpg, png or tiff) to a bunch
    of svg files (one svg file per document's page).
    """

    def add_arguments(self, parser):
        parser.add_argument(
            'document',
            help="Input document. Can be PDF, jpg, png or tiff"
        )
        parser.add_argument(
            '-l',
            '--lang',
            default='deu',
            help="Language to OCR"
        )

    def handle(self, *args, **options):
        document = options['document']
        lang = options['lang']
        output_document = f"{document.split('.')[0]}_output.pdf"

        ocrmypdf.ocr(
            document,
            output_document,
            lang=lang,
            progress_bar=False,
            pdf_renderer='hocr'
        )
