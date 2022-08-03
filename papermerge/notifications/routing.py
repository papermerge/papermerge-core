from django.urls import re_path

from .consumers import document as doc_consumer
from .consumers import inbox_refresh as inbox_refresh_consumer
from .consumers import DefaultConsumer

websocket_urlpatterns = [
    re_path(
        r'ws/document/$',
        doc_consumer.DocumentConsumer.as_asgi()
    ),
    re_path(
        r'ws/nodes/inbox-refresh/$',
        inbox_refresh_consumer.InboxRefreshConsumer.as_asgi()
    ),
    re_path(
        r'ws/',
        DefaultConsumer.as_asgi()
    ),
]
