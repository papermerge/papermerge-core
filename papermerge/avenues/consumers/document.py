import json
import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer


from papermerge.core.task_monitor import (
    task_monitor,
    TASK_SUCCEEDED,
    TASK_RECEIVED,
    TASK_STARTED,
    CORE_TASKS_OCR_PAGE
)


logger = logging.getLogger(__name__)


class DocumentConsumer(JsonWebsocketConsumer):

    group_name = "ocr_document"

    def connect(self):
        logger.debug("CONNECT")
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
        logger.debug("DISCONNECT")
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def receive(self, text_data):
        logger.debug(f"RECEIVED {text_data}")
        message = json.loads(text_data)
        document_id = message['document_id']
        items = task_monitor.items(
            task_name=CORE_TASKS_OCR_PAGE,
            document_id=document_id,
        )
        new_type = ''
        for item in items:
            logger.debug(f"item['type']={item['type']}")
            if item['type'] == TASK_RECEIVED:
                new_type = 'ocrdocument.received'
                break
            elif item['type'] == TASK_STARTED:
                new_type = 'ocrdocument.started'
                break
            elif item['type'] == TASK_SUCCEEDED:
                new_type = 'ocrdocument.succeeded'
                break

        new_message = {
            'type': new_type,
            'document_id': document_id
        }
        logger.debug(f"GROUP SEND {new_message}")
        async_to_sync(
            self.channel_layer.group_send
        )(self.group_name, new_message)

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
