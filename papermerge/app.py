import os
from pathlib import Path
from logging.config import dictConfig

import yaml
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from papermerge.core.router_loader import discover_routers
from papermerge.core.version import __version__
from papermerge.core.config import get_settings
from papermerge.core.routers.version import router as version_router
from papermerge.core.routers.scopes import router as scopes_router
from papermerge.core.openapi import create_custom_openapi_generator

config = get_settings()
prefix = config.api_prefix
app = FastAPI(title="Papermerge DMS REST API", version=__version__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "Content-Disposition",  # This is crucial!
        "Content-Type",
        "Content-Length",
        "Accept-Ranges",
        "Last-Modified",
        "ETag"
    ]
)

# Auto-discover and register all feature routers
features_path = Path(__file__).parent / "core"
routers = discover_routers(features_path)

for router, feature_name in routers:
    app.include_router(router, prefix=prefix)

app.include_router(version_router, prefix=prefix)
app.include_router(scopes_router, prefix=prefix)


logging_config_path = Path(
    os.environ.get("PAPERMERGE__MAIN__LOGGING_CFG", "/etc/papermerge/logging.yaml")
)

if logging_config_path.exists() and logging_config_path.is_file():
    with open(logging_config_path, "r") as stream:
        config = yaml.load(stream, Loader=yaml.FullLoader)

    dictConfig(config)


app.openapi = create_custom_openapi_generator(app)
