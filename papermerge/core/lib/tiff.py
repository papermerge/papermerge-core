import os
import logging

from .runcmd import run
from ..app_settings import settings

logger = logging.getLogger(__name__)


def pdfname_from_tiffname(doc_url):
    """
    Given tiff document url, will return
    respective pdf file name. Returned
    file name can be use used as destination
    for tiff2pdf tool.

    Returns a tuple (new_doc_url, new_filename).
    new_doc_url - is new absolute path to the pdf file
    new_filename - is new pdf filename
    """
    # basename is filename + ext (no path)
    basename = os.path.basename(doc_url)
    base_root, base_ext = os.path.splitext(basename)
    root, ext = os.path.splitext(doc_url)
    new_doc_url = f"{root}.pdf"

    return new_doc_url, f"{base_root}.pdf"


def convert_tiff2pdf(doc_url):

    logger.debug(f"convert_tiff2pdf for {doc_url}")

    new_doc_url, new_filename = pdfname_from_tiffname(
        doc_url
    )

    logger.debug(
        f"tiff2pdf source={doc_url} dest={new_doc_url}"
    )

    cmd = (
        settings.BINARY_CONVERT,
        doc_url,
        new_doc_url,
    )

    run(cmd)

    # returns new filename
    return new_filename
