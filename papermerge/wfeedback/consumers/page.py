import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class PageConsumer(WebsocketConsumer):

    def connect(self):
        async_to_sync(
            self.channel_layer.group_add
        )("page_status", self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )("page_status", self.channel_name)

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        self.send(text_data=json.dumps({
            'message': message
        }))

    def page_status_ocr_started(self):
        # page_status.ocr_started
        pass

    def page_status_ocr_complete(self):
        # page_status.ocr_complete
        pass

    def page_status_indexed(self):
        # page_status.indexed
        pass




