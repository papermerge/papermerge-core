import functools
import io
import logging
import os
import time
from collections import abc, namedtuple
from typing import Optional

from pikepdf import Pdf

from papermerge.core.storage import abs_path, get_storage_instance
from papermerge.core.types import DocumentVersion

from .base64 import decode, encode
from .decorators import docstring_parameter

logger = logging.getLogger(__name__)


__all__ = ("docstring_parameter", "decode", "encode")


class Timer:
    """
    Timer class used to measure how much time
    certain code block took to complete.

    Example:

        with Timer() as t:
            main_ocr_page(...)

        logger.info(
            f"OCR took {t:.2f} seconds to complete"
        )
    """

    def __init__(self):
        self.total = None

    def __enter__(self):
        self.start = time.time()
        # important, because 'as' variable
        # is assigned only the result of __enter__()
        return self

    def __exit__(self, type, value, traceback):
        self.end = time.time()
        self.total = self.end - self.start

    def __str__(self):
        return f"{self.total:.2f}"


def clock(func):
    """
    Logs time (in seconds) it take the decorated function to execute
    """

    @functools.wraps(func)
    def inner(*args, **kwargs):
        t0 = time.perf_counter()

        result = func(*args, **kwargs)

        elapsed = time.perf_counter() - t0
        name = func.__name__
        arg_lst = [repr(arg) for arg in args]
        arg_lst.extend(f"{k}={v!r}" for k, v in kwargs.items())
        arg_str = ",".join(arg_lst)

        logger.debug(f"{elapsed:0.6f}s {name} called with {arg_str}")

        return result

    return inner


PageRecycleMapItem = namedtuple("PageRecycleMapItem", ["new_number", "old_number"])


class PageRecycleMap:
    """Maps new page numbers to old ones.

    Under the hood, when user deletes pages from a document version, a new
    document version is created and only "not deleted" pages of old document
    version are transferred. This transfer means that data, like OCRed files,
    database fields, from "old page" are moved to the "new page". Thus,
    the requirement to hold a structure which maps page from old document
    version to the new document version.

    Couple of examples.
    Say there is 6 pages document and user deletes pages numbered 1 and 2;

    |Old document version | New document version|
    ---------------------------------------------
    |        1            |    3                |
    |        2            |    4                |
    |        3            |    5                |
    |        4            |    6                |
    |        5            |                     |
    |        6            |                     |
    ---------------------------------------------

    Notice that pages retain their original label. Table above reads
    as follows: in the new document version page number "1" gets
    info from old document version page number "3". New page number "2"
    gets info from old page number "4". New page number "3" gets info
    from page number "5". And finally the new page number "4" gets info from
    old page number "6".

    One more example; this time consider 5 pages document. User
    deletes page number 1 and 5:

    |Old document version | New document version|
    ---------------------------------------------
    |        1            |    2                |
    |        2            |    3                |
    |        3            |    4                |
    |        4            |                     |
    |        5            |                     |
    ---------------------------------------------

    The mapping will be:
        [
            {new_number: 1, old_number: 2},
            {new_number: 2, old_number: 3},
            {new_number: 3, old_number: 4},
        ]

    Last example: total pages = 5, deleted pages = [2, 3]

    |Old document version | New document version|
    ---------------------------------------------
    |        1            |    1                |
    |        2            |    4                |
    |        3            |    5                |
    |        4            |                     |
    |        5            |                     |
    ---------------------------------------------

    Result mapping is:
        [
            {new_number: 1, old_number: 1},
            {new_number: 2, old_number: 4},
            {new_number: 3, old_number: 5},
        ]
    """

    def __init__(self, total: int, deleted: list[int] = []):
        if not isinstance(deleted, abc.Sequence):
            raise ValueError("`deleted` expected to be a sequence")

        if total < len(deleted):
            raise ValueError("`total` < `deleted`")

        self.total = total
        self.deleted = deleted

        _pages = [page for page in range(1, self.total + 1) if page not in self.deleted]
        _page_numbers = range(1, len(_pages) + 1)
        self.page_map = zip(_page_numbers, _pages)

    def __iter__(self):
        return self

    def __next__(self):
        item = next(self.page_map)
        if item:
            return PageRecycleMapItem(*item)

        raise StopIteration

    def __repr__(self):
        return f"PageRecycleMap(" f"total={self.total!r}, deleted={self.deleted!r}" f")"


def collect_text_streams(
    version: DocumentVersion, page_numbers: list[int]
) -> list[io.StringIO]:
    """
    Returns list of texts of given page numbers from specified document version

    Each page's text is wrapped as io.StringIO instance.
    """
    pages_map = {page.number: page for page in version.pages.all()}

    result = [io.StringIO(pages_map[number].text) for number in page_numbers]

    return result


def reuse_ocr_data_multi(
    src_old_version: DocumentVersion,
    dst_old_version: Optional[DocumentVersion],
    dst_new_version: DocumentVersion,
    page_numbers: list[int],
    position: int = 0,
):
    if dst_old_version is None:
        position = 0

    storage = get_storage_instance()
    page_map = [(pos, pos) for pos in range(1, position + 1)]

    if len(page_map) > 0 and dst_old_version is not None:
        for src_page_number, dst_page_number in page_map:
            src_page_path = PagePath(
                document_path=dst_old_version.document_path, page_num=src_page_number
            )
            dst_page_path = PagePath(
                document_path=dst_new_version.document_path, page_num=dst_page_number
            )
        storage.copy_page(src=src_page_path, dst=dst_page_path)

    page_map = zip(
        page_numbers,
        [pos for pos in range(position + 1, position + len(page_numbers) + 1)],
    )

    for src_page_number, dst_page_number in page_map:
        src_page_path = PagePath(
            document_path=src_old_version.document_path, page_num=src_page_number
        )
        dst_page_path = PagePath(
            document_path=dst_new_version.document_path, page_num=dst_page_number
        )
        storage.copy_page(src=src_page_path, dst=dst_page_path)

    if dst_old_version is not None:
        dst_old_total_pages = dst_old_version.pages.count()
        _range = range(position + 1, dst_old_total_pages + 1)
        page_map = [(pos, pos + len(page_numbers)) for pos in _range]

        for src_page_number, dst_page_number in page_map:
            src_page_path = PagePath(
                document_path=dst_old_version.document_path, page_num=src_page_number
            )
            dst_page_path = PagePath(
                document_path=dst_new_version.document_path, page_num=dst_page_number
            )
            storage.copy_page(src=src_page_path, dst=dst_page_path)


def reuse_text_field(
    old_version: DocumentVersion, new_version: DocumentVersion, page_map: list
) -> None:
    streams = collect_text_streams(
        version=old_version,
        # list of old_version page numbers
        page_numbers=[item[1] for item in page_map],
    )

    # updates page.text fields and document_version.text field
    new_version.update_text_field(streams)


def reuse_text_field_multi(
    src_old_version: DocumentVersion,
    dst_old_version: Optional[DocumentVersion],
    dst_new_version: DocumentVersion,
    page_numbers: list[int],
    position: int = 0,
):
    """
    Copies `text` field from two sources to the destination

    :param src_old_version: source 1
    :param dst_old_version: source 2
    :param dst_new_version: destination
    :param page_numbers: which pages from source 1 to copy
    :param position: at which position (in destination) to insert pages

    reuse_text_field_multi updates `text` field of destination document version
    and each of its associated pages.

    Note: page `position` starts with 0
    `page_numbers` is a list of page numbers. In this list, page numbering
    starts with 1.
    """
    if dst_old_version is None:
        position = 0

    page_map = [(pos, pos) for pos in range(1, position + 1)]
    streams = []
    if len(page_map) > 0 and dst_old_version is not None:
        streams.extend(
            collect_text_streams(
                version=dst_old_version, page_numbers=[item[1] for item in page_map]
            )
        )

    streams.extend(
        collect_text_streams(version=src_old_version, page_numbers=page_numbers)
    )

    if dst_old_version is not None:
        dst_new_total_pages = dst_new_version.pages.count()
        _range = range(position + 1 + len(page_numbers), dst_new_total_pages + 1)
        page_numbers_to_collect = [pos - len(page_numbers) for pos in _range]
        streams.extend(
            collect_text_streams(
                version=dst_old_version, page_numbers=list(page_numbers_to_collect)
            )
        )

    dst_new_version.update_text_field(streams)


def remove_pdf_pages(
    old_version: DocumentVersion, new_version: DocumentVersion, page_numbers: list[int]
):
    """
    :param old_version: is instance of DocumentVersion
    :param new_version:  is instance of DocumentVersion
    :param page_numbers: numbers of pages to delete. Numbering starts with 1.

    Notice that page numbering starts with 1 i.e. page_numbers=[1, 2] -
    will remove first and second pages.
    """
    # delete page from document's new version associated file

    if len(page_numbers) < 1:
        raise ValueError("Empty page_numbers")

    pdf = Pdf.open(old_version.file_path)

    if len(pdf.pages) < len(page_numbers):
        raise ValueError("Too many values in page_numbers")

    _deleted_count = 0
    for page_number in page_numbers:
        pdf.pages.remove(p=page_number - _deleted_count)
        _deleted_count += 1

    new_version.file_path.parent.mkdir(parents=True, exist_ok=True)

    pdf.save(new_version.file_path)


def insert_pdf_pages(
    src_old_version: DocumentVersion,
    dst_old_version: Optional[DocumentVersion],
    dst_new_version: DocumentVersion,
    src_page_numbers: list[int],
    dst_position: int = 0,
) -> None:
    """Inserts pages from source to destination at given position

    In case both `dst_old_version` and `dst_new_version` parameters
    are non-empty `DocumentVersion` instances - `insert_pdf_pages` will take
    `src_page_numbers` from `src_old_version` and
    insert them at `dst_position` of `dst_old_version` and will
    save result in `dst_new_version`.

    In case `dst_old_version` is None - `insert_pdf_pages` will
    take `src_page_numbers` from `src_old_version` and insert
    at position 0 of the newly created pdf. Newly created pdf will be saved
    at `dst_new_version`.

    Remarks:
    `dst_position` starts with 0.
    In `src_page_numbers` page numbering starts with 1 i.e.
    when `src_page_numbers=[1, 2]` means insert first and second pages from
    source document version.
    """
    src_old_pdf = Pdf.open(src_old_version.file_path)

    if dst_old_version is None:
        # case of total merge
        dst_old_pdf = Pdf.new()
        dst_position = 0
    else:
        dst_old_pdf = Pdf.open(dst_old_version.file_path)

    _inserted_count = 0
    for page_number in src_page_numbers:
        pdf_page = src_old_pdf.pages.p(page_number)
        dst_old_pdf.pages.insert(dst_position + _inserted_count, pdf_page)
        _inserted_count += 1

    dst_new_version.file_path.parent.mkdir(parents=True, exist_ok=True)

    dst_old_pdf.save(abs_path(dst_new_version.file_path))


def total_merge(
    src_old_version: "DocumentVersion", dst_new_version: "DocumentVersion"
) -> None:
    """
    Merge source document version with destination

    'Total' means 'all pages'.
    """
    # all pages of the source
    page_numbers = [page.number for page in src_old_version.pages.all()]

    insert_pdf_pages(
        src_old_version=src_old_version,
        dst_old_version=None,
        dst_new_version=dst_new_version,
        src_page_numbers=page_numbers,
        dst_position=0,
    )
    reuse_ocr_data_multi(
        src_old_version=src_old_version,
        dst_old_version=None,
        dst_new_version=dst_new_version,
        position=0,
        page_numbers=page_numbers,
    )

    reuse_text_field_multi(
        src_old_version=src_old_version,
        dst_old_version=None,
        dst_new_version=dst_new_version,
        position=0,
        page_numbers=page_numbers,
    )
    # Total merge deletes source document.
    # Because all pages of the source are moved to destination, source's
    # last version remains "without pages". A document version without pages
    # does not make sense to stay around - thus we delete it!
    src_old_version.document.delete()


def reorder_pdf_pages(old_version, new_version, pages_data, page_count):
    src = Pdf.open(abs_path(old_version.document_path.url))

    dst = Pdf.new()
    reodered_list = sorted(pages_data, key=lambda item: item["new_number"])

    for list_item in reodered_list:
        page = src.pages.p(list_item["old_number"])
        dst.pages.append(page)

    dirname = os.path.dirname(abs_path(new_version.document_path.url))
    os.makedirs(dirname, exist_ok=True)
    dst.save(abs_path(new_version.document_path.url))


def rotate_pdf_pages(old_version, new_version, pages_data):
    """
    ``pages`` data is a list of dictionaries. Each dictionary is expected
    to have following keys:
        - number
        - angle
    """
    src = Pdf.open(abs_path(old_version.document_path.url))

    for page_data in pages_data:
        page = src.pages.p(page_data["number"])
        page.rotate(page_data["angle"], relative=True)

    dirname = os.path.dirname(abs_path(new_version.document_path.url))
    os.makedirs(dirname, exist_ok=True)
    src.save(abs_path(new_version.document_path.url))
