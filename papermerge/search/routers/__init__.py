from fastapi import FastAPI

from .search import router as search_router

__all__ = ("register_routers",)


def register_routers(app: FastAPI):
    app.include_router(search_router)
