from fastapi import FastAPI

from .nodes import router as nodes_router
from .users import router as users_router
from .auth import router as auth_router
from .folders import router as folders_router

__all__ = ("register_routers",)


def register_routers(app: FastAPI):
    app.include_router(auth_router)
    app.include_router(users_router)
    app.include_router(nodes_router)
    app.include_router(folders_router)
