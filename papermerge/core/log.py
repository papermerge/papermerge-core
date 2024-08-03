import logging
from celery.app import default_app as celery_app

logger = logging.getLogger(__name__)


def log_task_routes():
    logger.info("Task Routes:")
    for key, value in celery_app.conf.task_routes.items():
        logger.info(f"{key} -> {value['queue']}")
