import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer

from papermerge.core.models import Document
from papermerge.core.models import utils as model_utils
from papermerge.notifications.mixins import RequireAuth

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


class DocumentConsumer(RequireAuth, JsonWebsocketConsumer):
    """
    Synchronous Consumer.

    It is safe to run Django ORM operations inside synchronous consumer.
    """

    group_name = "ocr_document_task"

    def disconnect(self, close_code):
        logger.debug("DISCONNECT")

        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def ocrdocumenttask_taskreceived(self, event: dict):
        logger.debug(
            "ocrdocumenttask_taskreceived triggered"
        )
        self._ocr_document_event(
            event=event,
            type=model_utils.OCR_STATUS_RECEIVED
        )

    def ocrdocumenttask_taskstarted(self, event: dict):
        logger.debug(
            "ocrdocumenttask_taskstarted triggered"
        )
        self._ocr_document_event(
            event=event,
            type=model_utils.OCR_STATUS_STARTED
        )

    def ocrdocumenttask_tasksucceeded(self, event: dict):
        logger.debug(
            "ocrdocumenttask_tasksucceeded triggered"
        )
        self._ocr_document_event(
            event=event,
            type=model_utils.OCR_STATUS_SUCCEEDED
        )

    def ocrdocumenttask_taskfailed(self, event: dict):
        logger.debug(
            "ocrdocumenttask_taskfailed triggered"
        )
        self._ocr_document_event(
            event=event,
            type=model_utils.OCR_STATUS_FAILED
        )

    def _ocr_document_event(self, event, type):
        if event['user_id'] != str(self.user.id):
            # notification is intended only for user who initiated it
            return

        _update_document_ocr_status(event, type)

        logger.debug(
            f"Doc Consumer ev={event} type={type} for user_id={self.user.id}"
        )
        self.send_json(event)
