import os
from fastapi import FastAPI

from .search import router as search_router

__all__ = ("register_routers",)

API_PREFIX = os.environ.get("PAPERMERGE__MAIN__API_PREFIX", "/api")


def register_routers(app: FastAPI):
    app.include_router(search_router, prefix=API_PREFIX)
