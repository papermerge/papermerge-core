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


class StoreKlass:
    pass

# StoreKlass will be actually loaded from configurations
# Default value will be papermerge.task_monitor.store.RedisStore


task_monitor = Monitor(store=StoreKlass())
