import logging


from .task import Task


logger = logging.getLogger(__name__)


class Monitor:
    """
    Monitors celery task states based on incoming events.

    papermerge.avenues is basically a django channels based app.

    Celery does not provide a convinient task monitoring API, it just
    blindly saves tasks' metadata.
    This class is ment to fill that gap. It conviniently saves
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
            page_num='',
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

        updated_task_dict = self.update(event, task)

        if self.is_monitored_task(updated_task_dict['task_name']):
            self.callback(updated_task_dict)

    def update(self, event, task):
        """
        Merge new attributes into existing task key
        """
        key = self.get_key(event)
        found_attr = self.store.get(key, {})
        found_attr.update(dict(task))

        if len(found_attr) > 0:
            self.store[key] = found_attr
            self.store.expire(key)

        return found_attr

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

    def count(self, **task_attrs):
        """
        Counts tasks with matching set of attributes.

        Example of usage:

        cnt = monitor.count(
            task_name='papermerge.core.tasks.ocr_page',
            document_id=113,
            user_id=334,
            version=1
        )

        cnt is the number of ocr_page tasks associated with user_id=334,
        document=113 and document version=1
        """
        result = 0
        # iterate one by one redis keys with given prefix
        for redis_value in self.store.scan_iter(f"{self.prefix}:*"):
            # compare **task_attrs with retrieved value
            # from redis store.
            matched_attr_count = 0
            for key, value in task_attrs.items():
                if redis_value[key] == value:
                    matched_attr_count += 1

            # if all task attributes matched
            if matched_attr_count == len(task_attrs):
                result += 1

        return result
