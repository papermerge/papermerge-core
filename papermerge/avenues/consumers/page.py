import json
import logging

from django.core.exceptions import ObjectDoesNotExist

from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from channels.layers import get_channel_layer

from papermerge.core.task_monitor import (
    task_monitor,
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

    def receive(self, text_data):
        logger.debug(f"RECEIVED {text_data}")
        message = json.loads(text_data)
        page_ids = message['page_ids']

        for page_id in page_ids:
            items = task_monitor.items(
                task_name=CORE_TASKS_OCR_PAGE,
                # type here has celery specific value.
                page_id=page_id,
            )
            items_list = list(items)

            if len(items_list) > 0:
                item = items[0]
                channel_layer = get_channel_layer()
                _type = f"ocrpage.{item['type'].replace('-', '')}"
                channel_data = {
                    'type': _type,
                    'page_id': page_id,
                }
                async_to_sync(
                    channel_layer.group_send
                )(
                    self.ocr_document_group_name,
                    channel_data
                )

    def _should_notify_received(self, document_id) -> bool:
        """
        Should we notify ocr_document group channel/DocumentConsumer
        that document's OCR task was received?

        Document's OCR is considered received when OCR task is received for
        at least one of its pages.
        """
        if not document_id:
            return False

        if not hasattr(self, '_received'):
            self._received = {}

        if self._received.get(document_id, None) is None:
            self._received[document_id] = 0
        else:
            self._received[document_id] += 1

        return not bool(self._received[document_id])

    def _should_notify_started(self, document_id, user_id) -> bool:
        """
        Should we notify ocr_document group channel/DocumentConsumer
        that document's OCR started?

        Document's OCR starts when OCR started (or completed) on at
        least one of its pages.
        """

        if not document_id:
            return False

        if not user_id:
            return False

        if not hasattr(self, '_started'):
            self._started = {}

        if self._started.get(document_id, None) is None:
            self._started[document_id] = 0
        else:
            self._started[document_id] += 1

        _started = self._started[document_id]
        ret_value = not bool(_started)
        logger.debug(
            f"_should_notify_started document_id={document_id} "
            f"_started={_started} "
            f" ret_value={ret_value}"
        )
        return ret_value

    def _should_notify_succeeded(self, document_id, user_id) -> bool:
        """
        Should we notify ocr_document group channel/DocumentConsumer
        about document OCR completion ?

        It is considered that document's OCR is complete when each
        page of the document was successfully OCRed.

        To figure it out if OCR of each page of the document
        succeeded we count number of tasks `ocr_page` of type `task-succeeded`
        associated to `document_id` and `user_id`.
        """
        if not document_id:
            return False

        if not user_id:
            return False

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
            total_items = len(list(items))
            page_count = doc.page_count
            should_notify = total_items == doc.page_count
            logger.debug(
                f"_should_notify_succeeded document_id={document_id} "
                f" total_items={total_items} "
                f" page_count={page_count}"
            )
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
        document_id = event.get('document_id', None)
        if self._should_notify_received(document_id):
            # notify ocr_document group about event
            self._notify(
                user_id=event['user_id'],
                document_id=document_id,
                _type='ocrdocument.received'
            )
        event['type'] = 'ocrpage.received'
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
        document_id = event.get('document_id', None)
        user_id = event.get('user_id', None)
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
        event['type'] = 'ocrpage.started'
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
        document_id = event.get('document_id', None)
        user_id = event.get('user_id', None)
        if self._should_notify_succeeded(
            user_id=user_id,
            document_id=document_id
        ):
            self._notify(
                user_id=user_id,
                document_id=document_id,
                _type='ocrdocument.succeeded'
            )
        event['type'] = 'ocrpage.succeeded'
        self.send_json(event)
