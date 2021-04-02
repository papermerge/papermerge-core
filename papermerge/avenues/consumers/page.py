import logging

from django.core.exceptions import ObjectDoesNotExist

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

    def _should_notify_received(self, document_id):
        if not hasattr(self, '_received'):
            self._received = {}

        if self._received.get(document_id, None) is None:
            self._received[document_id] = 0
        else:
            self._received[document_id] += 1

        return not bool(self._received[document_id])

    def _should_notify_started(self, document_id, user_id):
        tasks = task_monitor.items(
            task_name=CORE_TASKS_OCR_PAGE,
            user_id=user_id,
            document_id=document_id,
        )
        ocr_tasks_for_doc_count = 0
        for task in tasks:
            if task['type'] in (TASK_SUCCEEDED, TASK_STARTED):
                ocr_tasks_for_doc_count += 1

        logger.debug(f"COUNT={ocr_tasks_for_doc_count}")
        # started for the document
        # if there is exactly 1 started or succeeded
        return ocr_tasks_for_doc_count == 1

    def _should_notify_succeeded(self, document_id, user_id):
        items = task_monitor.items(
            task_name=CORE_TASKS_OCR_PAGE,
            # type here has celery specific value.
            type=TASK_SUCCEEDED,
            user_id=user_id,
            document_id=document_id,
        )
        should_notify = False
        try:
            doc = Document.objects.get(pk=document_id)
            # all document pages were successfully OCRed
            should_notify = len(list(items)) == doc.page_count
        except ObjectDoesNotExist:
            logger.error(
                f"Document ID={document_id} was not found."
            )
            return False

        return should_notify

    def _notify(self, document_id, user_id, _type):
        channel_layer = get_channel_layer()
        channel_data = {
            'type': _type,
            'user_id': user_id,
            'document_id': document_id,
        }
        async_to_sync(
            channel_layer.group_send
        )(
            self.ocr_document_group_name,
            channel_data
        )

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
        document_id = event['document_id']
        if self._should_notify_received(document_id):
            # notify ocr_document group about event
            self._notify(
                user_id=event['user_id'],
                document_id=document_id,
                _type='ocrdocument.received'
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
        document_id = event['document_id']
        user_id = event['user_id']
        if self._should_notify_started(
            user_id=user_id,
            document_id=document_id
        ):
            # notify ocr_document group about event
            self._notify(
                user_id=user_id,
                document_id=document_id,
                _type='ocrdocument.started'
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
        user_id = event['user_id']
        if self._should_notify_succeeded(
            user_id=user_id,
            document_id=document_id
        ):
            self._notify(
                user_id=user_id,
                document_id=document_id,
                _type='ocrdocument.succeeded'
            )
        self.send_json(event)
