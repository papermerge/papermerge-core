import json
import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer


logger = logging.getLogger(__name__)


class PageConsumer(JsonWebsocketConsumer):

    group_name = "ocr_page"

    def connect(self):
        logger.info(f"JOINED GROUP = {self.group_name}")
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        logger.info(f"LEFT GROUP = {self.group_name}")
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        logger.info(f"CHANNEL_RECEIVED={text_data_json}")

    def ocrpage_taskreceived(self, event):
        page_data = {}
        #page_data['task_data'] = event['task_data']
        logger.info(f"OCR_PAGE_TASK_RECEIVED event={event}")
        self.send_json(page_data)

    def ocrpage_taskstarted(self, event):
        page_data = {}
        #page_data['task_data'] = event['task_data']
        logger.info(f"OCR_PAGE_TASK_STARTED event={event}")
        self.send_json(page_data)

    def ocrpage_tasksucceeded(self, event):
        page_data = {}
        #page_data['task_data'] = event['task_data']
        logger.info(f"OCR_PAGE_TASK_SUCCEEDED event={event}")
        self.send_json(page_data)
