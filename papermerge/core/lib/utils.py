import os
import logging
import importlib.machinery
import importlib.util


logger = logging.getLogger(__name__)

SAFE_EXTENSIONS = [
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
    given total pages and a list of deleted pages - returns
    a list of assignations of pages:
        [new_version_page_num, old_version_page_num]
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
    if total_pages < len(deleted_pages):
        err_msg = "total_pages < deleted_pages"
        raise ValueError(err_msg)

    # only numbers of pages which were not deleted
    pages = [
        page for page in list(range(1, total_pages + 1))
        if page not in deleted_pages
    ]

    page_numbers = range(1, len(pages) + 1)

    return list(zip(page_numbers, pages))


def load_config(config_file):

    loader_ = importlib.machinery.SourceFileLoader(
        "config",
        config_file
    )
    spec = importlib.util.spec_from_file_location(
        "config", config_file, loader=loader_
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    # and stop looking for ther configs.
    cfg_papermerge = vars(mod)
    cfg_file_found = True

    return cfg_papermerge, cfg_file_found


def try_load_config(config_locations, config_env_var_name):

    cfg_file_found = False
    cfg_papermerge = {}

    for config_file in config_locations:
        if os.path.exists(config_file):
            cfg_papermerge, cfg_file_found = load_config(config_file)
            if cfg_file_found:
                break

    if not cfg_file_found:
        config_file = os.environ.get(config_env_var_name, False)
        if config_file:
            try:
                cfg_papermerge, cfg_file_found = load_config(config_file)
            except FileNotFoundError:
                err_msg = "Failed attempted to read" +\
                    f" configuration file '{config_file}'" +\
                    f" pointed by environment variable '{config_env_var_name}'"
                raise FileNotFoundError(err_msg)

    return cfg_papermerge
