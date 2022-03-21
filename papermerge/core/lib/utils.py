import os
import logging


logger = logging.getLogger(__name__)

SAFE_EXTENSIONS = [
    '.svg',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
    '.hocr',
    '.pdf',
    '.tiff'
]


def get_bool(key, default="NO"):
    """
    Returns True if environment variable named KEY is one of
    "yes", "y", "t", "true" (lowercase of uppercase)

    otherwise returns False
    """
    env_var_value = os.getenv(key, default).lower()
    YES_VALUES = ("yes", "y", "1", "t", "true")
    if env_var_value in YES_VALUES:
        return True

    return False


def safe_to_delete(place):
    if not os.path.exists(place):
        logging.warning(
            f"Trying to delete not exising folder"
            f" {place}"
        )
        return False

    for root, dirs, files in os.walk(place):
        for name in files:
            base, ext = os.path.splitext(name)
            if ext.lower() not in SAFE_EXTENSIONS:
                logger.warning(
                    f"Trying to delete unsefe location: "
                    f"extention={ext} not found in {SAFE_EXTENSIONS}"
                )
                return False

    return True


def get_assigns_after_delete(total_pages, deleted_pages):
    """
    Given total pages and a list of deleted pages - returns
    a list of assignations of pages:
        [new_version_page_num, old_version_page_num]
    Which reads 'new_version_page_num' gets info from
    `old_version_page_num`.

    Example 1:
        total_pages: 6
        deleted_pages: [1, 2]
        returns: [
            [(1, 3),  (2, 4), (3, 5), (4, 6)]
            # page #1 gets info from prev page #3
            # page #2 ... #4
            ...
            # page #4 ... #6
        ]

    Example 2:
        total pages: 5
        deleted_pages [1, 5]
        returns: [
            [(1, 2), (2, 3), (3, 4)
        ]

    Example 3:
        total pages: 5
        deleted_pages [2, 3]
        returns: [
            [(1, 1), (2, 4), (3, 5)
            # page #1 stays unaffected
            # page #2 gets the info from page number 4
            # page #3 gets info from page #5
        ]
    """
    if not isinstance(deleted_pages, list):
        err_msg = 'deleted_pages is expected to be a list'
        raise ValueError(err_msg)

    if total_pages < len(deleted_pages):
        err_msg = 'total_pages < deleted_pages'
        raise ValueError(err_msg)

    # only numbers of pages which were not deleted
    pages = [
        page for page in list(range(1, total_pages + 1))
        if page not in deleted_pages
    ]

    page_numbers = range(1, len(pages) + 1)

    return list(zip(page_numbers, pages))


def get_reordered_list(pages_data, page_count):
    """
    Returns a list of integers. Each number in the list
    is correctly positioned (newly ordered) page.
    Examples:
    If in document with 4 pages first and second pages were
    swapped, then returned list will be:
        [2, 1, 3, 4]
    If first page was swapped with last one (also 4 paegs document)
    result list will look like:
        [4, 2, 3, 1]
    """
    results = []
    page_map = {number: number for number in range(1, page_count + 1)}

    for item in pages_data:
        k = int(item['old_number'])
        v = int(item['new_number'])
        page_map[k] = v

    for number in range(1, page_count + 1):
        results.append(
            page_map[number]
        )

    return results


def annotate_page_data(pages, pages_data, field='angle'):
    """
    Returns a list of dictionaries containing objects with two keys:
        - number
        - ``field``

    ``number`` is extracted from ``pages`` queryset.
    ``filed`` is extracted from pages_data.

    :param pages: Pages queryset
    :param pages_data: list of dictionaries. Each dictionary contains
    key 'id' and ``field``.
    """
    ret = []
    for page in pages:
        page_dict = {}
        page_dict['number'] = page.number
        for page_data in pages_data:
            if str(page.id) == str(page_data['id']):
                page_dict[field] = page_data[field]

        ret.append(page_dict)

    return ret
