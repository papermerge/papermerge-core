import os
import re
import subprocess
import logging
from magic import from_file

import pikepdf

from ..app_settings import settings
from ..exceptions import FileTypeNotSupported

"""
Uses command line pdfinfo utility (from poppler pakage) for various
small operations (e.g. get pdf page count).
"""

logger = logging.getLogger(__name__)


def _split(stdout):
    """
    stdout is result.stdout where result
    is whatever is returned by subprocess.run
    """
    decoded_text = stdout.decode(
        'utf-8',
        # in case there are decoding issues, just replace
        # problematic characters. We don't need text verbatim.
        'replace'
    )
    lines = decoded_text.split('\n')

    return lines


def _get_tiff_pagecount(filepath):
    cmd = [
        settings.BINARY_IDENTIFY,
        "-format",
        "%n\n",
        filepath
    ]
    compl = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    if compl.returncode:

        logger.error(
            "get_tiff_pagecount: cmd=%s args=%s stdout=%s stderr=%s code=%s",
            cmd,
            compl.args,
            compl.stdout,
            compl.stderr,
            compl.returncode,
            stack_info=True
        )

        raise Exception("Error occured while getting document page count.")

    lines = _split(stdout=compl.stdout)
    # look up for the line containing "Pages: 11"
    for line in lines:
        x = re.match(r"(\d+)", line.strip())
        if x:
            return int(x.group(1))

    return 0


def get_pagecount(filepath: str) -> int:
    """
    Returns the number of pages in a file given by filepath.

    filepath - is filesystem path to a PDF/JPEG/PNG/TIFF document
    """
    if not os.path.isfile(filepath):
        raise ValueError("Filepath %s is not a file" % filepath)

    if os.path.isdir(filepath):
        raise ValueError("Filepath %s is a directory!" % filepath)

    base, ext = os.path.splitext(filepath)
    mime_type = from_file(filepath, mime=True)
    # pure images (png, jpeg) have only one page :)

    if mime_type in ['image/png', 'image/jpeg', 'image/jpg']:
        # whatever png/jpg image is there - it is
        # considered by default one page document.
        return 1

    # In case of REST API upload (via PUT + form multipart)
    # django saves temporary file as application/octet-stream
    # Checking extentions is an extra method of finding out correct
    # mime type
    if ext and ext.lower() in ('.jpeg', '.png', '.jpg'):
        return 1

    if mime_type == 'image/tiff':
        return _get_tiff_pagecount(filepath)

    # In case of REST API upload (via PUT + form multipart)
    # django saves temporary file as application/octet-stream
    # Checking extentions is an extra method of finding out correct
    # mime type
    if ext and ext.lower() in ('.tiff', ):
        return _get_tiff_pagecount(filepath)

    if mime_type != 'application/pdf':
        # In case of REST API upload (via PUT + form multipart)
        # django saves temporary file as application/octet-stream
        # Checking extentions is an extra method of finding out correct
        # mime type
        if ext and ext.lower() != '.pdf':
            raise FileTypeNotSupported(
                "Only jpeg, png, pdf and tiff are handled by this"
                " method"
            )

    count = 0
    with pikepdf.Pdf.open(filepath) as pdf:
        count = len(pdf.pages)

    return count


__all__ = [
    get_pagecount
]
