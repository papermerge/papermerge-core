import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer


logger = logging.getLogger(__name__)


class DocumentConsumer(JsonWebsocketConsumer):

    group_name = "ocr_document_task"

    def connect(self):
        logger.debug(
            f"DocumentConsumer CONNECT group_name{self.group_name}"
            f" channel_name={self.channel_name}"
        )
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        logger.debug("DISCONNECT")
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def ocrdocumenttask_taskreceived(self, event):
        logger.debug(
            f"DocumentConsumer ocrdocumenttask_received event={event}"
        )
        self.send_json(event)

    def ocrdocumenttask_taskstarted(self, event):
        logger.debug(
            f"DocumentConsumer ocrdocumenttask_started event={event}"
        )
        self.send_json(event)

    def ocrdocumenttask_tasksucceeded(self, event):
        logger.debug(
            f"DocumentConsumer ocrdocumenttask_succeeded event={event}"
        )
        self.send_json(event)
