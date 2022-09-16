import time
import logging
import re
import functools
from datetime import datetime

from django.conf import settings
from django.utils.html import format_html
from django.urls import reverse


logger = logging.getLogger(__name__)


def date_2int(kv_format, str_value):
    # maps PAPERMERGE_METADATA_DATE_FORMATS to
    # https://docs.python.org/3.8/library/datetime.html#strftime-and-strptime-format-codes

    if not str_value:
        return 0

    format_map = {
        'dd.mm.yy': '%d.%m.%y',
        'dd.mm.yyyy': '%d.%m.%Y',
        'dd.M.yyyy': '%d.%B.%Y',
        'month': '%B'
    }
    try:
        _date_instance = datetime.strptime(
            str_value, format_map[kv_format]
        )
    except Exception as e:
        # this is expected because of automated
        # extraction of metadata may fail.
        logger.debug(
            f"While converting date user format {e}"
        )
        return 0

    return _date_instance.timestamp()


def money_2int(kv_format, str_value):
    return number_2int(kv_format, str_value)


def number_2int(kv_format, str_value):
    """
    kv_format for number is usually something like this:

        dddd
        d,ddd
        d.ddd

    So converting to an integer means just remove from string
    non-numeric characters and cast remaining str to integer.
    """
    if str_value:
        line = re.sub(r'[\,\.]', '', str_value)
        return line

    return 0


def node_tag(node):

    node_url = reverse("core:node", args=(node.id,))
    tag = format_html(
        "<a href='{}'>{}</a>",
        node_url,
        node.title
    )

    return tag


def document_tag(node):

    node_url = reverse("core:document", args=(node.id,))
    tag = format_html(
        "<a href='{}'>{}</a>",
        node_url,
        node.title
    )

    return tag


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


def filter_node_id(value):
    """Invalid values of node id will be
    filtered out (return None).

    Valid values for node id will pass
    and will be returned as integers.
    """
    if not value:
        return None

    if isinstance(value, str):
        if value.isnumeric():
            return int(value)
        return None

    if isinstance(value, int):
        if value < 0:
            return None

        return value

    return None


def remove_backup_filename_id(value: str) -> str:
    """
    value is a string that looks like something__number,
    i.e. consists of two parts separated by double underscore.
    Second part (__number) is a number.
    Examples:

        blah.pdf__23
        boo__1
        asdlaksd__100

    This function returns first part of the string:

    value: blah.pdf__23 => result: blah.pdf
           boo__1  => boo

    Other examples:

        boox_1       => boox
        boox         => boox
        boox_____100 => boox
        None         => None
    """
    # works only with string input
    if not value:
        return None

    if not isinstance(value, str):
        return value

    result = value.split('_')

    if len(result) <= 2:
        return result[0]

    return "_".join(result[0:-2])


def namespaced(name):
    if settings.PAPERMERGE_NAMESPACE is not None:
        return f"{settings.PAPERMERGE_NAMESPACE}__{name}"

    return name


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
        arg_lst.extend(f'{k}={v!r}' for k, v in kwargs.items())
        arg_str = ','.join(arg_lst)

        logger.debug(f'{elapsed:0.6f}s {name} called with {arg_str}')

        return result

    return inner
