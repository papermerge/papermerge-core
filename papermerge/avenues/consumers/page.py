import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer


logger = logging.getLogger(__name__)


class PageConsumer(JsonWebsocketConsumer):

    group_name = "page_status"

    def connect(self):
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )("page_status", self.channel_name)

    def ocrpage_taskreceived(self, event):
        page_data = {}
        page_data['task_data'] = event['task_data']
        logger.info(f"OCR_PAGE_TASK_RECEIVED data={page_data}")
        self.send_json(page_data)

    def ocrpage_taskstarted(self, event):
        page_data = {}
        page_data['task_data'] = event['task_data']
        logger.info(f"OCR_PAGE_TASK_STARTED data={page_data}")
        self.send_json(page_data)

    def ocrpage_tasksucceeded(self, event):
        page_data = {}
        page_data['task_data'] = event['task_data']
        logger.info(f"OCR_PAGE_TASK_SUCCEEDED data={page_data}")
        self.send_json(page_data)
