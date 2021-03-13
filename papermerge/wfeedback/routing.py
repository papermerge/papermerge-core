from django.urls import re_path

from .consumers import document as doc_consumer
from .consumers import page as page_consumer

websocket_urlpatterns = [
    re_path(
        r'ws/document-feedback/$',
        doc_consumer.DocumentConsumer.as_asgi()
    ),
    re_path(
        r'ws/page-feedback/$',
        page_consumer.PageConsumer.as_asgi()
    )
]
