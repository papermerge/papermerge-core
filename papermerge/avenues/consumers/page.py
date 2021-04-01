import logging

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from channels.layers import get_channel_layer

from papermerge.core.task_monitor import (
    task_monitor,
    TASK_RECEIVED,
    TASK_STARTED,
    TASK_SUCCEEDED,
    CORE_TASKS_OCR_PAGE
)
from papermerge.core.models import Document


logger = logging.getLogger(__name__)


class PageConsumer(JsonWebsocketConsumer):

    group_name = "ocr_page"
    ocr_document_group_name = "ocr_document"

    def connect(self):
        async_to_sync(
            self.channel_layer.group_add
        )(self.group_name, self.channel_name)
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(
            self.channel_layer.group_discard
        )(self.group_name, self.channel_name)

    def ocrpage_taskreceived(self, event):
        """
        * type = which is 'ocrpage.taskreceived'
        * user_id
        * document_id
        * page_num
        * lang
        * version
        * namespace
        * file_name
        """
        logger.debug(f"OCR_PAGE_TASK_RECEIVED event={event}")
        count = task_monitor.count(
            task_name=CORE_TASKS_OCR_PAGE,
            type=TASK_RECEIVED,
            user_id=event['user_id'],
            document_id=event['document_id'],
            version=event['version']
        )
        if count == 1:
            # notify ocr_document group about event
            channel_layer = get_channel_layer()
            channel_data = {
                'type': 'ocrdocument.received',
                'user_id': event['user_id'],
                'document_id': event['document_id'],
                'version': event['version']
            }
            async_to_sync(
                channel_layer.group_send
            )(
                self.ocr_document_group_name,
                channel_data
            )
        self.send_json(event)

    def ocrpage_taskstarted(self, event):
        """
        * type = which is 'ocrpage.taskstarted'
        * user_id
        * document_id
        * page_num
        * lang
        * version
        * namespace
        * file_name
        """
        logger.debug(f"OCR_PAGE_TASK_STARTED event={event}")
        count = task_monitor.count(
            task_name=CORE_TASKS_OCR_PAGE,
            type=TASK_STARTED,
            user_id=event['user_id'],
            document_id=event['document_id'],
            version=event['version']
        )
        if count == 1:
            # notify ocr_document group about event
            channel_layer = get_channel_layer()
            channel_data = {
                'type': 'ocrdocument.started',
                'user_id': event['user_id'],
                'document_id': event['document_id'],
                'version': event['version']
            }
            async_to_sync(
                channel_layer.group_send
            )(
                self.ocr_document_group_name,
                channel_data
            )
        self.send_json(event)

    def ocrpage_tasksucceeded(self, event):
        """
        event is a dictionary with following keys:

        * type = which is 'ocrpage.tasksucceeded'
        * user_id
        * document_id
        * page_num
        * lang
        * version
        * namespace
        * file_name
        """
        logger.debug(f"OCR_PAGE_TASK_SUCCEEDED event={event}")
        document_id = event['document_id']
        version = event['version']
        user_id = event['user_id']
        count = task_monitor.count(
            task_name=CORE_TASKS_OCR_PAGE,
            # type here has celery specific value.
            type=TASK_SUCCEEDED,
            user_id=event['user_id'],
            document_id=event['document_id'],
            version=event['version']
        )
        try:
            doc = Document.objects.get(pk=document_id, version=version)
            # all document pages were successfully OCRed
            if count == doc.page_count:
                # notify ocr_document group about event
                channel_layer = get_channel_layer()
                channel_data = {
                    'type': 'ocrdocument.started',
                    'user_id': user_id,
                    'document_id': document_id,
                    'version': version
                }
                async_to_sync(
                    channel_layer.group_send
                )(
                    self.ocr_document_group_name,
                    channel_data
                )
        except Document.ObjectDoesNotExist:
            logger.error(
                f"Document ID={document_id} Version={version} was not found"
            )
        self.send_json(event)
