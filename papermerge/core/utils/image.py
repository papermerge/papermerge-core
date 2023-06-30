from pathlib import Path

from pdf2image import convert_from_path
from pdf2image.generators import counter_generator


def generate_preview(
    pdf_path: Path,
    output_folder: Path,
    size: int = 100,
    page_number: int = 1,
):
    """Generate jpg thumbnail/preview images of PDF document"""
    kwargs = {
        'pdf_path': str(pdf_path),
        'output_folder': str(output_folder),
        'fmt': 'jpg',
        'first_page': page_number,
        'last_page': page_number,
        'size': (size,),
        'output_file': counter_generator(padding_goal=3)
    }

    output_folder.mkdir(exist_ok=True)

    # generates jpeg previews of PDF file using pdftoppm (poppler-utils)
    convert_from_path(**kwargs)
