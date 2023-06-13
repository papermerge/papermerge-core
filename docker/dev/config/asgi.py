import os
import importlib.metadata

from django.core.asgi import get_asgi_application
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

get_asgi_application()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

fastapp = FastAPI(
    title="Papermerge DMS",
    version=importlib.metadata.version("papermerge-core")
)

fastapp.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def init(app: FastAPI):
    from papermerge.core.routers import register_routers

    register_routers(app)

init(fastapp)


