import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

http_asgi_app = get_asgi_application()

import papermerge.notifications.routing  # noqa

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "http": http_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            papermerge.notifications.routing.websocket_urlpatterns
        )
    ),
    # Just HTTP for now. (We can add other protocols later.)
})
