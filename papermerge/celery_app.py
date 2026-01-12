import os

from celery import Celery

PREFIX = os.environ.get("PM_PREFIX", None)
broker_url = os.environ.get("PM_REDIS_URL", None)

if broker_url:
    app = Celery("papermerge", broker=broker_url)
else:
    app = Celery("papermerge")


app.conf.broker_transport_options = {
    "max_retries": 3,
    "interval_start": 0,
    "interval_step": 0.2,
    "interval_max": 0.2,
}


def prefixed(name: str) -> str:
    if PREFIX:
        return f"{PREFIX}_{name}"

    return name


def s3_queue_name() -> str:
    """
    User can override S3 queue name by setting PM_S3_QUEUE_NAME

    Depending on the scenarios, s3 queue name may look like:

    - s3: there is no prefix and no override
    - demo_s3: there is a prefix
    - s3_demo_node4: user has overridden PM_S3_QUEUE_NAME with
        queue name specific to the k8s node.
    """
    name = os.environ.get("PM_S3_QUEUE_NAME", None)
    if name is not None:
        return name

    return prefixed("s3")


def s3preview_queue_name() -> str:
    """
    User can override S3 preview queue name by setting
    PM_S3_PREVIEW_QUEUE_NAME

    Depending on the scenarios, s3 queue name may look like:

    - s3preview: there is no prefix and no override
    - demo_s3review: there is a prefix
    - s3preview_demo_node4: user has overridden
        PM_S3_PREVIEW_QUEUE_NAME with queue name specific
        to the k8s node.
    """
    name = os.environ.get("PM_S3_PREVIEW_QUEUE_NAME", None)
    if name is not None:
        return name

    return prefixed("s3preview")


app.conf.task_routes = {
    "s3": {"queue": s3_queue_name()},
    "process_upload": {"queue": s3_queue_name()},
    # `s3_worker`: generates previews and uploads them to s3 storage
    # via s3preview queue
    "s3preview": {"queue": s3preview_queue_name()},
    "ocr": {"queue": prefixed("ocr")},
    "path_tmpl": {"queue": prefixed("path_tmpl")},
}
