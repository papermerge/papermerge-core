import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

logger = logging.getLogger(__name__)


class InboxRefreshConsumer(JsonWebsocketConsumer):
    group_name = "inbox_refresh"

    def connect(self):
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def inbox_refresh(self, data):
        logger.info(
            f"inbox_refresh data={data}"
        )
        self.send_json(data)
