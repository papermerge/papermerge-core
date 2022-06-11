import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from papermerge.notifications.mixins import RequireAuth

logger = logging.getLogger(__name__)


class NodesMoveConsumer(RequireAuth, JsonWebsocketConsumer):
    group_name = "nodes_move"

    def disconnect(self, close_code):
        logger.debug("Nodes Move DISCONNECT")
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def nodesmove_taskreceived(self, event: dict):
        logger.debug(
            "novesmove_taskreceived triggered"
        )
        self._node_move_event(event)

    def nodesmove_taskstarted(self, event: dict):
        logger.debug(
            "novesmove_taskstarted triggered"
        )
        self._node_move_event(event)

    def nodesmove_tasksucceeded(self, event: dict):
        logger.debug(
            "novesmove_tasksucceeded triggered"
        )
        self._node_move_event(event)

    def _node_move_event(self, event):
        if event['user_id'] != str(self.user.id):
            # send event only for user who initiated node move
            return

        logger.debug(
            f"NodeMove event={event} for user_id={self.user.id}"
        )
        self.send_json(event)
