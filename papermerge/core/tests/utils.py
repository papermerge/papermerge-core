from pathlib import Path

from fastapi import FastAPI

from papermerge.core.router_loader import discover_routers


def get_app_with_routes():
    app = FastAPI()

    core_path = Path(__file__).parent.parent
    routers = discover_routers(core_path)

    for router, feature_name in routers:
        app.include_router(router, prefix="")

    return app
