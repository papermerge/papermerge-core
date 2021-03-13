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

    def receive(self, page_data, status):
        page_data_json = json.loads(page_data)
        page = page_data_json['page']

        async_to_sync(self.channel_layer.group_send)(
            "page_status",
            {
                "type": "page_status.message",
                "page": page,
                "status": status
            },
        )

    def page_status_ocr_started(self, event):
        # page_status.ocr_started
        self.send(
            page_data=event["page_data"],
            page_status="ocr_started"
        )

    def page_status_ocr_complete(self, event):
        # page_status.ocr_complete
        self.send(
            page_data=event["page_data"],
            page_status="ocr_complete"
        )

    def page_status_indexed(self, event):
        # page_status.indexed
        self.send(
            page_data=event["page_data"],
            page_status="indexed"
        )
