import os

from channels.routing import ProtocolTypeRouter, URLRouter

from papermerge.notifications.middleware import TokenAuthMiddleware
from papermerge.notifications.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "websocket": TokenAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})
