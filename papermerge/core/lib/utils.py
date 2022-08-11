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
