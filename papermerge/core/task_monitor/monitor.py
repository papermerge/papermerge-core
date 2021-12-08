import logging


from .task import Task


logger = logging.getLogger(__name__)


class Monitor:
    """
    Monitors celery task states based on incoming events.

    papermerge.notifications is basically a django channels based app.

    Celery does not provide a convenient task monitoring API, it just
    blindly saves tasks' metadata.
    This class is ment to fill that gap. It conveniently saves
    events information and provides a handy API to work with
    saved tasks.

    Example of usage:

    def send2channel(task_dict):
        pass

    monitor = Monitor(store=RedisStore())

    # Monitor celery task with specified name

    monitor.add_task(
        Task(
            "papermerge.core.tasks.ocr_page",
            user_id='',
            document_id='',
            lang='',
            version='',
            namespace=''
        )
    )
    # call send2channel callback every time there
    # is an incoming (monitored) event
    monitor.set_callback(send2channel)
    """

    def __init__(self, store, prefix="task-monitor"):
        # redis store
        self.store = store
        self.prefix = prefix
        # A list of monitored tasks
        self._tasks = []
        # callback to invoke when new event arrived
        self.callback = None

    def add_task(self, task):
        self._tasks.append(task)

    def set_callback(self, callback):
        self.callback = callback

    def get_key(self, event):

        task_id = event['uuid']
        key = f"{self.prefix}:{task_id}"

        return key

    def save_event(self, event):
        task = self.get_task_from(event)

        logger.debug(f"save_event: event={event}")
        updated_task_dict = self.update(event, task)
        logger.debug(f"save_event: updated_task_dict={event}")

        task_name = updated_task_dict.get('task_name', None)
        if task_name and self.is_monitored_task(task_name):
            self.callback(updated_task_dict)

    def update(self, event, task):
        """
        Merge new attributes into existing task key
        """
        key = self.get_key(event)
        found_attrs = self.store.get(key, {})
        found_attrs.update(dict(task))

        if len(found_attrs) > 0:
            # remove empty values from dictionary,
            # otherwise redis compains
            found_attrs = {
                key: value
                for key, value in found_attrs.items()
                if value
            }

            self.store[key] = found_attrs
            self.store.expire(key)

        return found_attrs

    def get_task_from(self, event):
        """
        Given even object (which is a dictionary)
        return a task object
        """
        task = None
        task_name = event.get('name', None)

        if self.is_monitored_task(task_name):
            task = self.get_task(task_name)
            task.update(event.get('kwargs', None))
            task['type'] = event.get('type', None)

        if not task:
            task = Task(task_name, type=event.get('type', None))

        return task

    def get_task(self, task_name):
        for task in self._tasks:
            if task == task_name:
                return task

        return None

    def is_monitored_task(self, task_name):
        for task in self._tasks:
            if task == task_name:
                return True

        return False

    def items(self, **task_attrs):
        """
        Generator which yields tasks with matching given set of attributes.

        Example of usage:

        cnt = monitor.items(
            task_name='papermerge.core.tasks.ocr_document_task',
            document_id=113,
            user_id=334,
            version=1
        )

        len(list(cnt))

        cnt is the number of ocr_page tasks associated with user_id=334,
        document=113 and document version=1
        """
        # iterate one by one redis keys with given prefix
        for redis_key in self.store.scan_iter(f"{self.prefix}:*"):
            # compare **task_attrs with retrieved value
            # from redis store.
            matched_attr_count = 0
            for key, value in task_attrs.items():
                # redis value here is a dictionary
                redis_value = self.store[redis_key]
                rvalue = redis_value.get(key, '')
                if str(rvalue) == str(value):
                    matched_attr_count += 1

            # if all task attributes matched
            if matched_attr_count == len(task_attrs):
                yield redis_value
