import logging
import tarfile
import json


from papermerge.core.backup_restore.serializers import (
    UserSerializer,
    TagSerializer
)

logger = logging.getLogger(__name__)


def restore_data(file_path: str):
    """Restores data from backup archive"""

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
