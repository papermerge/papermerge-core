import logging


from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.utils.module_loading import import_string

from papermerge.core.app_settings import settings

from .monitor import Monitor
from .task import (
    Task,
    dict2channel_data
)

"""
Task monitor is sort of proxy between celery events and django
channels (django channels in turn communicates with websocket clients)

-------------------------------------------------------------------------
|celery events <--> task_monitor <--> papermerge.avenues <--> websockets|
-------------------------------------------------------------------------

papermerge.avenues is django channels app.

PS:
papermerge.avenues should have been named 'papermerge.channels' in order to
have a more intuitive association with django channels, but in such case
app labels (both apps would have 'channels' label) will conflict.
"""

logger = logging.getLogger(__name__)

CORE_TASKS_OCR_DOCUMENT_TASK = 'papermerge.core.tasks.ocr_document_task'

# celery specific values for 'type' attribute
# of celery events.
TASK_SENT = 'task-sent'
TASK_RECEIVED = 'task-received'
TASK_STARTED = 'task-started'
TASK_SUCCEEDED = 'task-succeeded'
TASK_FAILED = 'task-failed'


def get_store_class(import_path=None):

    return import_string(
        import_path or settings.TASK_MONITOR_STORE_CLASS
    )


StoreKlass = get_store_class()
store = StoreKlass(
    url=settings.TASK_MONITOR_STORE_URL,
    timeout=settings.TASK_MONITOR_STORE_KEYS_TIMEOUT
)


def send2channel(task_dict):
    channel_layer = get_channel_layer()
    logger.debug(f"send2channel channel_layer={channel_layer}")

    group_name, channel_data = dict2channel_data(task_dict)
    logger.debug(
        f"Sending group_name='{group_name}' "
        f"Channel Data='{channel_data}' "
    )
    async_to_sync(
        channel_layer.group_send
    )(
        group_name, channel_data
    )


task_monitor = Monitor(prefix="task-monitor", store=store)
# add tasks to monitor
task_monitor.add_task(
    Task(
        'papermerge.core.tasks.ocr_document_task',
        user_id='',
        document_id='',
        lang='',
        version='',
        namespace=''
    )
)
task_monitor.set_callback(send2channel)
