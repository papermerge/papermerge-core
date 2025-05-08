import os

from celery import Celery

PREFIX = os.environ.get("PAPERMERGE__MAIN__PREFIX", None)
broker_url = os.environ.get("PAPERMERGE__REDIS__URL", None)

if broker_url:
    app = Celery("papermerge", broker=broker_url)
else:
    app = Celery("papermerge")

# Workaround celery's bug:
# https://github.com/celery/celery/issues/4296
# Without this options, if broker is down, the celery
# will loop forever in apply_async.
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
    User can override S3 queue name by setting PAPERMERGE__MAIN__S3_QUEUE_NAME

    Depending on the scenarios, s3 queue name may look like:

    - s3: there is no prefix and no override
    - demo_s3: there is a prefix
    - s3_demo_node4: user has overridden PAPERMERGE__MAIN__S3_QUEUE_NAME with
        queue name specific to the k8s node.
    """
    name = os.environ.get("PAPERMERGE__MAIN__S3_QUEUE_NAME", None)
    if name is not None:
        return name

    return prefixed("s3")


def s3preview_queue_name() -> str:
    """
    User can override S3 preview queue name by setting
    PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME

    Depending on the scenarios, s3 queue name may look like:

    - s3preview: there is no prefix and no override
    - demo_s3review: there is a prefix
    - s3preview_demo_node4: user has overridden
        PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME with queue name specific
        to the k8s node.
    """
    name = os.environ.get("PAPERMERGE__MAIN__S3_PREVIEW_QUEUE_NAME", None)
    if name is not None:
        return name

    return prefixed("s3preview")


app.conf.task_routes = {
    # `s3_worker`: uploads/downloads of document version files
    # via s3 queue
    "s3": {"queue": s3_queue_name()},
    # `s3_worker`: generates previews and uploads them to s3 storage
    # via s3preview queue
    "s3preview": {"queue": s3preview_queue_name()},
    # index worker - sends index add/remove/updates
    "i3": {"queue": prefixed("i3")},
    "ocr": {"queue": prefixed("ocr")},
    "path_tmpl": {"queue": prefixed("path_tmpl")},
}
