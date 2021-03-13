from django.urls import re_path

from .consumers import document as doc_consumer
from .consumers import page as page_consumer

websocket_urlpatterns = [
    re_path(
        r'ws/wfeedback/document/(?P<doc_id>\d+)/$',
        doc_consumer.DocumentConsumer.as_asgi()
    ),
    re_path(
        r'ws/wfeedback/page/(?P<doc_id>\d+)/$',
        page_consumer.PageConsumer.as_asgi()
    )
]
