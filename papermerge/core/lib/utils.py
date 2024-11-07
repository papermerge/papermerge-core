import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

SAFE_EXTENSIONS = [".svg", ".txt", ".jpg", ".jpeg", ".png", ".hocr", ".pdf", ".tiff"]


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


def safe_to_delete(path: Path) -> True:
    if not path.exists():
        logging.warning(f"Trying to delete not exising folder" f" {path}")
        return False

    for root, dirs, files in os.walk(path):
        for name in files:
            base, ext = os.path.splitext(name)
            if ext.lower() not in SAFE_EXTENSIONS:
                logger.warning(
                    f"Trying to delete unsefe location: "
                    f"extention={ext} not found in {SAFE_EXTENSIONS}"
                )
                return False

    return True
