import logging
import json
import redis

from django.conf import settings


logger = logging.getLogger(__name__)
# Connect to our Redis instance
redis_instance = redis.Redis.from_url(settings.CELERY_RESULT_BACKEND)

TASK_RECEIVED = 'task-received'
TASK_MONITOR_PREFIX = 'xtask-monitor'


class Store:

    def __init__(self, *args, **kwargs):
        pass

    def __getitem__(self, key):
        pass

    def __setitem__(self, key):
        pass

    def expire(self, key):
        pass


class RedisStore(Store):

    def __init__(self, redis, timeout):
        self._redis = redis
        # keys timeout in seconds
        self._timeout = timeout

    def __getitem__(self, key):
        return self.redis.hgetall(key)

    def __setitem__(self, key, value):
        self.redis.hmset(key, value)

    def expire(self, key):
        self.redis.expire(key, self._timeout)


class TaskMonitor:
    """
    Tracks or monitors task states based on incoming celery events.

    Celery does not provide a convinient task monitoring API, it just
    blindly saves tasks' metadata.
    This class is ment to fill that gap. It conviniently saves
    event information and provides a handy API to work with those
    saved tasks.

    Example of usage:

    monitor = TaskMonitor()

    # Monitor celery task with specified name
    monitor.add_filter(
        name='papermerge.core.tasks.ocr_page',
        kwargs=[  # extract this kwargs from the task
            'user_id',
            'document_id',
            'lang'
        ]

    # Get a QuerySet for 'papermerge.core.tasks.ocr_page' tasks
    # so that saved tasks can queries in similar way to django models are
    ocr_page_qs = monitor['papermerge.core.tasks.ocr_page']

    # total count of ocr_page tasks
    ocr_page_qs.count()

    # total count of ocr_page tasks executed specifically for DOC_ID
    ocr_page_qs.find(document_id=DOC_ID).count()

    # iterage over all tasks for document ID which are still active
    # i.e. their stage is one of:
    # * task-sent
    # * task-received
    # * task-started
    for task in ocr_page_qs.find(document_id=DOC_ID).active():
        print(task['page_num'], task['state'])
    """

    def __init__(self, store):
        self._store = store

    def add_filter(self):
        pass

    def save_event(self, event):

        task_dict = {}
        task_id = event['uuid']
        key = f"{self._prefix}-{task_id}"

        for condition in self._conditions:
            if condition['name'] != event.get('name', None):
                continue

            kwargs = event['kwargs']
            if len(kwargs) <= 2:
                continue

            data = json.loads(kwargs.replace("'", '"'))
            for attr in condition['attrs']:
                task_dict[attr] = data.get(attr, '')

        self._merge(key, task_dict)

    def _merge(self, key, attr_dict):
        """
        Merge new attributes into existing task key
        """
        existing_task_dict = self._store[key]
        existing_task_dict.update(attr_dict)

        self._store[key] = existing_task_dict
        self._store.expire(key)

    def __getitem__(self, task_name):
        """
        Returns an iterator over saved tasks with specified name
        """
        return QuerySet(task_name=task_name)


class Task:

    def __init__(self, name):
        self.name = name
        self.state = None


class QuerySet:
    """
    Represent a lazy database/store/redis lookup for a set of tasks
    """

    def __init__(self, task_name):
        self._task_name = task_name

    def find(self, **kwargs):
        pass

    def count(self):
        pass

    def active(self):
        pass


def save_event(event):
    """
    Saves event message into redis DB
    """
    task_dict = {}
    task_id = event['uuid']
    key = f"{TASK_MONITOR_PREFIX}_{task_id}"

    task_dict['type'] = event['type']

    if "name" in event and event['name'] == 'papermerge.core.tasks.ocr_page':
        kwargs_as_str = event['kwargs']

        if len(event['kwargs']) > 2:
            kwargs_as_dict = json.loads(kwargs_as_str.replace("'", '"'))
            task_dict['name'] = event.get('name', '')
            task_dict['type'] = event['type']
            task_dict['user_id'] = kwargs_as_dict.get('user_id', '')
            task_dict['document_id'] = kwargs_as_dict.get('document_id', '')
            task_dict['page_num'] = kwargs_as_dict.get('page_num', '')
            task_dict['namespace'] = kwargs_as_dict.get('namespace', '')
            task_dict['lang'] = kwargs_as_dict.get('lang', '')

    # eventually merge value from redis
    old_task_dict = redis_instance.hgetall(key)
    logger.info(f"OLD TASK DICT: {old_task_dict} for KEY={key}")
    old_task_dict.update(task_dict)
    logger.info(f"NEW TASK DICT: {old_task_dict} for KEY={key}")
    redis_instance.hmset(key, old_task_dict)
    # all task monitor keys live about 3 hours
    redis_instance.expire(key, 3 * 3600)


def notify_consumers(event):
    """
    Notify consumers about the event
    """
    pass
