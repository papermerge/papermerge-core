from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class DocumentConsumer(WebsocketConsumer):

    group_name = "ocr_document"

    def connect(self):
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)

        # listen to page_status messages
        # If all pages of the document were OCRed
        # then document status changes.
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def ocrdocument_received(self, event):
        """
        Document's OCR is considered 'received' when
        OCR task of the first page of the document is received.
        First page of the document here does not mean
        page number 1 (as order). OCR of the document's page can
        start with page number 3 for example.
        """
        self.send_json(event)

    def ocrdocument_started(self, event):
        """
        Document's OCR starts when
        OCR task of the first page of the document is starts.
        First page of the document here does not mean
        page number 1 (as order). OCR of the document's page can
        start with page number 3 for example.
        """
        self.send_json(event)

    def ocrdocument_succeeded(self, event):
        """
        Document's OCR succeeds when
        OCR on all its pages succeeds.
        """
        self.send_json(event)
