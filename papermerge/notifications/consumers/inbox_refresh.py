import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from papermerge.notifications.mixins import RequireAuth

logger = logging.getLogger(__name__)


class InboxRefreshConsumer(RequireAuth, JsonWebsocketConsumer):
    group_name = "inbox_refresh"

    def connect(self):
        self.user = self.scope["user"]
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def inbox_refresh(self, data):
        self.send_json(data)
