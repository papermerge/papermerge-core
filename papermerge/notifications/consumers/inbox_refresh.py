import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from papermerge.notifications.mixins import RequireAuth

logger = logging.getLogger(__name__)


class InboxRefreshConsumer(RequireAuth, JsonWebsocketConsumer):
    group_name = "inbox_refresh"

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def inbox_refresh(self, data):
        logger.debug("inbox_refresh event triggered")

        if data['user_id'] != str(self.user.id):
            # notification is intended only for users who
            # initiated document updates
            return

        logger.debug(
            f"inbox refresh data={data} for user_id={self.user.id}"
        )
        self.send_json(data)
