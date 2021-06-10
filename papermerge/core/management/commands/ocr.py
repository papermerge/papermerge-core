import ocrmypdf

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = """
    Runs OCRmyPDF on a given a document (pdf, jpg, png or tiff).
    Creates associated svg, hocr and jpeg preview files.

    Example of usage:

    ./manage.py ocr ~/Desktop/file1.pdf --sidecar-dir ~/Desktop/file1 -l deu
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
            '--sidecar-dir',
            help="Folder where to write generated files"
        )
        parser.add_argument(
            '--sidecar-format',
            help="Format of generated output",
            choices=["html", "svg"],
            default="svg"
        )
        parser.add_argument(
            '--preview-width',
            help="Base width of preview image",
            type=int,
            default=400
        )
        parser.add_argument(
            '-k',
            '--keep-temporary-files',
            action='store_true',
            help="Keep temporary files"
        )

    def handle(self, *args, **options):
        document = options['document']
        sidecar_dir = options['sidecar_dir']
        sidecar_format = options['sidecar_format']
        lang = options['lang']
        keep = options['keep_temporary_files']
        output_document = f"{document.split('.')[0]}_output.pdf"
        preview_width = options['preview_width']

        ocrmypdf.ocr(
            document,
            output_document,
            lang=lang,
            plugins=["ocrmypdf_papermerge.plugin"],
            progress_bar=True,
            pdf_renderer='hocr',
            use_threads=True,
            keep_temporary_files=keep,
            sidecar_dir=sidecar_dir,
            sidecar_format=sidecar_format,
            preview_width=preview_width
        )
