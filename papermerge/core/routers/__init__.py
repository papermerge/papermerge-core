from fastapi import FastAPI

from .document_version import router as document_versions_router
from .documents import router as documents_router
from .folders import router as folders_router
from .nodes import router as nodes_router
from .ocr_languanges import router as ocr_langs_router
from .pages import router as pages_router
from .tags import router as tags_router
from .thumbnails import router as thumbnails_router
from .users import router as users_router
from .ws import router as ws_router

__all__ = ("register_routers",)


def register_routers(app: FastAPI):
    app.include_router(users_router)
    app.include_router(nodes_router)
    app.include_router(folders_router)
    app.include_router(documents_router)
    app.include_router(document_versions_router)
    app.include_router(pages_router)
    app.include_router(thumbnails_router)
    app.include_router(ws_router)
    app.include_router(tags_router)
    app.include_router(ocr_langs_router)
