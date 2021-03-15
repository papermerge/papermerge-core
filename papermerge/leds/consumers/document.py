import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class DocumentConsumer(WebsocketConsumer):

    def connect(self):
        async_to_sync(
            self.channel_layer.group_add
        )("document_status", self.channel_name)

        # listen to page_status messages
        # If all pages of the document were OCRed
        # then document status changes.
        async_to_sync(
            self.channel_layer.group_add
        )("page_status", self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )("document_status", self.channel_name)

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        self.send(text_data=json.dumps({
            'message': message
        }))

    def document_status_ocr_started(self, event):
        # page_status.ocr_started
        pass

    def document_status_ocr_complete(self, event):
        # page_status.ocr_complete
        pass

    def document_status_indexed(self, event):
        # page_status.indexed
        pass
