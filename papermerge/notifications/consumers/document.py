import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from papermerge.core.models import Document
from papermerge.core.models import utils as model_utils

logger = logging.getLogger(__name__)


def _update_document_ocr_status(event: dict, ocr_status):
    """
    Example of event:
    {'type': 'ocrdocumenttask.taskreceived', 'document_id': 22, 'lang': 'deu'}
    """
    if 'document_id' in event:
        document_id = event['document_id']
        try:
            document = Document.objects.get(pk=document_id)
            document.ocr_status = ocr_status
            document.save()
        except Document.DoesNotExist as exc:
            # not end of the world, but still good to know
            logger.warning(
                f"Consumer did not found the document_id={document_id}"
            )
            logger.warning(exc)
            # life goes on...


class DocumentConsumer(JsonWebsocketConsumer):
    """
    Synchronous Consumer.

    It is safe to run Django ORM operations inside synchronous consumer.
    """

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

    def ocrdocumenttask_taskreceived(self, event: dict):
        _update_document_ocr_status(event, model_utils.OCR_STATUS_RECEIVED)
        logger.debug(
            f"DocumentConsumer ocrdocumenttask_received event={event}"
        )
        self.send_json(event)

    def ocrdocumenttask_taskstarted(self, event):
        _update_document_ocr_status(event, model_utils.OCR_STATUS_STARTED)
        logger.debug(
            f"DocumentConsumer ocrdocumenttask_started event={event}"
        )
        self.send_json(event)

    def ocrdocumenttask_tasksucceeded(self, event):
        _update_document_ocr_status(event, model_utils.OCR_STATUS_SUCCEEDED)
        logger.debug(
            f"DocumentConsumer ocrdocumenttask_succeeded event={event}"
        )
        self.send_json(event)

    def ocrdocumenttask_taskfailed(self, event):
        self.send_json(event)
