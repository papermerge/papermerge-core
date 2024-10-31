import logging
import os

from fastapi import FastAPI

from papermerge.core.features.custom_fields.router import router as custom_fields_router
from papermerge.core.features.document_types.router import (
    router as document_types_router,
)
from papermerge.core.features.groups.router import router as groups_router
from papermerge.core.log import log_task_routes

from .document_version import router as document_versions_router
from .documents import router as documents_router
from .folders import router as folders_router
from .nodes import router as nodes_router
from .ocr_languanges import router as ocr_langs_router
from .pages import router as pages_router
from .probe import router as probe_router
from .scopes import router as scopes_router
from .tags import router as tags_router
from .tasks import router as tasks_router
from .thumbnails import router as thumbnails_router
from .users import router as users_router
from .version import router as version_router

__all__ = ("register_routers",)

API_PREFIX = os.environ.get("PAPERMERGE__MAIN__API_PREFIX", "/api")
logger = logging.getLogger(__name__)

log_task_routes()


def register_routers(app: FastAPI):
    app.include_router(users_router, prefix=API_PREFIX)
    app.include_router(nodes_router, prefix=API_PREFIX)
    app.include_router(folders_router, prefix=API_PREFIX)
    app.include_router(documents_router, prefix=API_PREFIX)
    app.include_router(document_versions_router, prefix=API_PREFIX)
    app.include_router(pages_router, prefix=API_PREFIX)
    app.include_router(thumbnails_router, prefix=API_PREFIX)
    app.include_router(tags_router, prefix=API_PREFIX)
    app.include_router(tasks_router, prefix=API_PREFIX)
    app.include_router(ocr_langs_router, prefix=API_PREFIX)
    app.include_router(version_router, prefix=API_PREFIX)
    app.include_router(scopes_router, prefix=API_PREFIX)
    app.include_router(groups_router, prefix=API_PREFIX)
    app.include_router(probe_router, prefix=API_PREFIX)
    app.include_router(custom_fields_router, prefix=API_PREFIX)
    app.include_router(document_types_router, prefix=API_PREFIX)
