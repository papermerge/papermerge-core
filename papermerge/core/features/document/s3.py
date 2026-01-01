from uuid import UUID

from papermerge.core.config import get_settings
from papermerge.core.types import ImagePreviewSize

settings = get_settings()


def _get_backend():
    """Get the appropriate storage backend."""
    from papermerge.storage import get_storage_backend
    return get_storage_backend()


def doc_thumbnail_signed_url(uid: UUID) -> str:
    backend = _get_backend()
    return backend.doc_thumbnail_signed_url(uid)


def page_image_jpg_signed_url(uid: UUID, size: ImagePreviewSize) -> str:
    backend = _get_backend()
    return backend.page_image_jpg_signed_url(uid, size)


def doc_ver_signed_url(doc_ver_id: UUID, file_name: str) -> str:
    backend = _get_backend()
    return backend.doc_ver_signed_url(doc_ver_id, file_name)
