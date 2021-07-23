from django.urls import re_path

from .consumers import document as doc_consumer

websocket_urlpatterns = [
    re_path(
        r'ws/document/$',
        doc_consumer.DocumentConsumer.as_asgi()
    ),
]
