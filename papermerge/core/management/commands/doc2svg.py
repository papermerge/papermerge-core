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
        parser.add_argument(
            '--output-dir',
            help="Folder where to write generated files"
        )
        parser.add_argument(
            '--output-format',
            help="Format of generated output",
            choices=["html", "svg"],
            default="svg"
        )
        parser.add_argument(
            '-k',
            '--keep-temporary-files',
            action='store_true',
            help="Keep temporary files"
        )

    def handle(self, *args, **options):
        document = options['document']
        output_dir = options['output_dir']
        output_format = options['output_format']
        lang = options['lang']
        keep = options['keep_temporary_files']
        output_document = f"{document.split('.')[0]}_output.pdf"

        ocrmypdf.ocr(
            document,
            output_document,
            lang=lang,
            plugins=["ocrmypdf_papermerge.custom_engine"],
            progress_bar=True,
            pdf_renderer='hocr',
            use_threads=True,
            keep_temporary_files=keep,
            output_dir=output_dir,
            output_format=output_format
        )
