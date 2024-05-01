import os

from django.core.asgi import get_asgi_application
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from papermerge.core.version import __version__

get_asgi_application()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

fastapp = FastAPI(
    title="Papermerge DMS",
    version=__version__
)

fastapp.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def init(app: FastAPI):
    from papermerge.core.routers import \
        register_routers as register_core_routes
    from papermerge.search.routers import \
        register_routers as register_search_routes

    register_core_routes(app)
    register_search_routes(app)

init(fastapp)
