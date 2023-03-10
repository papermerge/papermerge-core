import os

from django.core.asgi import get_asgi_application
from fastapi import FastAPI

# Load django apps. This line must be before any other
# imports, otherwise there is "Apps aren't loaded yet exception
get_asgi_application()

from papermerge.notifications.routing import websocket_urlpatterns
from channels.routing import ProtocolTypeRouter, URLRouter

from papermerge.notifications.middleware import TokenAuthMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "websocket": TokenAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})

fastapp = FastAPI()

def init(app: FastAPI):
    from papermerge.core.routers import register_routers

    register_routers(app)

init(fastapp)
