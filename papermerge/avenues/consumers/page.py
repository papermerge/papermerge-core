import logging
import json

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
        data = {
            str(k): str(v)
            for k, v in page_data.items()
        }
        logger.info(f"OCR_PAGE_TASK_RECEIVED data={data}")
        self.send_json(data)

    def ocrpage_taskstarted(self, event):
        page_data = {}
        page_data['task_data'] = event['task_data']
        data = {
            str(k): str(v)
            for k, v in page_data.items()
        }
        logger.info(f"OCR_PAGE_TASK_STARTED data={data}")
        self.send_json(data)

    def ocrpage_tasksucceeded(self, event):
        page_data = {}
        page_data['task_data'] = event['task_data']
        data = {
            str(k): str(v)
            for k, v in page_data.items()
        }
        logger.info(f"OCR_PAGE_TASK_SUCCEEDED data={data}")
        self.send_json(data)

