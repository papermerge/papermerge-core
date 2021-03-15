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

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        page = text_data_json['page']
        status = text_data_json['status']

        async_to_sync(self.channel_layer.group_send)(
            self.group_name,
            {
                "type": "page_feedback.message",
                "page": page,
                "status": status
            },
        )

    def page_ocr_start(self, event):
        # page_status.ocr_started
        logger.debug(event)
        page_data = {}
        page_data['page'] = event['page']
        page_data['status'] = "ocr_start"

        self.send_json(page_data)

    def page_txt_ready(self, event):
        # page_status.ocr_started
        logger.debug(event)
        page_data = {}
        page_data['page'] = event['page']
        page_data['status'] = "txt_ready"

        self.send_json(page_data)

    def page_hocr_ready(self, event):
        # page_status.ocr_started
        logger.debug(event)
        page_data = {}
        page_data['page'] = event['page']
        page_data['status'] = "hocr_ready"

        self.send_json(page_data)
