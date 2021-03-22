from django.utils.module_loading import import_string

from papermerge.core.app_settings import settings

from .monitor import Monitor

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


def get_store_class(import_path=None):

    return import_string(
        import_path or settings.TASK_MONITOR_STORE_CLASS
    )


StoreKlass = get_store_class()
store = StoreKlass(
    url=settings.TASK_MONITOR_STORE_URL,
    timeout=settings.TASK_MONITOR_STORE_KEYS_TIMEOUT
)

task_monitor = Monitor(store=store)
