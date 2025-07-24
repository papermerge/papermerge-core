from papermerge.core import config
from papermerge.core.storage.aws import AWSS3Storage
from papermerge.core.storage.generic import GenericS3Storage

settings = config.get_settings()


def get_storage():
    provider = settings.papermerge__s3__provider

    if provider in ("minio", "vk"):
        return GenericS3Storage()
    else:
        return AWSS3Storage()
