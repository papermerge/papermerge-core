import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)
MEDIA_ROOT = os.environ.get("PAPERMERGE__MAIN__MEDIA_ROOT", "./media")


def get_storage_class(import_path=None):
    return None


def get_storage_instance():
    return None


def abs_path(some_relative_path: Path) -> Path:
    return Path(MEDIA_ROOT) / some_relative_path
