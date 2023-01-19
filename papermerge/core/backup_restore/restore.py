import logging
import tarfile
import json

from django.conf import settings

from papermerge.core.lib.path import AUX_DIR_SIDECARS, AUX_DIR_DOCS

from papermerge.core.backup_restore.serializers import (
    UserSerializer,
    TagSerializer
)

logger = logging.getLogger(__name__)


def restore_db_data(file_path: str) -> None:
    with tarfile.open(file_path, mode="r:gz") as file:
        backup_json = file.extractfile('backup.json')
        backup_info = json.load(backup_json)

        if 'users' not in backup_info:
            raise ValueError("'users' key is missing")

        user_ser = UserSerializer(backup_info['users'])
        if user_ser.is_valid():
            user_ser.save()

        for tag_data in backup_info['tags']:
            tag_ser = TagSerializer(data=tag_data)
            if tag_ser.is_valid():
                tag_ser.save()


def restore_files(file_path: str) -> None:
    with tarfile.open(file_path, mode="r:gz") as file:
        for tar_info in file:
            docs_or_sidecars_prefix = (AUX_DIR_SIDECARS, AUX_DIR_DOCS,)
            if tar_info.name.startswith(docs_or_sidecars_prefix):
                file.extract(tar_info, path=settings.MEDIA_ROOT)


def restore_data(file_path: str):
    """Restores data from backup archive"""
    restore_db_data(file_path)
    restore_files(file_path)
