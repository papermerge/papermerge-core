from .monitor import Monitor


class StoreKlass:
    pass

# StoreKlass will be actually loaded from configurations
# Default value will be papermerge.task_monitor.store.RedisStore


task_monitor = Monitor(store=StoreKlass())
