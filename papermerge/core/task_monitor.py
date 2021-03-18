import logging
import json
import redis

from django.conf import settings


logger = logging.getLogger(__name__)
# Connect to our Redis instance
redis_instance = redis.Redis.from_url(settings.CELERY_RESULT_BACKEND)

TASK_RECEIVED = 'task-received'
TASK_MONITOR_PREFIX = 'xtask-monitor'


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
