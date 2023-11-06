import json
import logging
import tarfile
from typing import Tuple

from django.conf import settings

from papermerge.core import constants, models
from papermerge.core.backup_restore import types

logger = logging.getLogger(__name__)


def restore_db_data(file_path: str) -> None:
    with tarfile.open(file_path, mode="r:gz") as file:
        backup_json = file.extractfile('backup.json')
        backup_info = json.load(backup_json)

        if 'users' not in backup_info:
            raise ValueError("'users' key is missing")

        for user_data in backup_info['users']:
            pyuser = types.User(**user_data)

            user, created = restore_user(pyuser)
            if not created:
                logger.info(f"User: {user} already exists")

            for node in pyuser.nodes:
                if getattr(node, 'versions', None):
                    # node is a Folder
                    restore_folder(node, user)
                else:
                    restore_document(node, user)


def restore_files(file_path: str) -> None:
    with tarfile.open(file_path, mode="r:gz") as file:
        for tar_info in file:
            extracted_dir_prefixes = (constants.DOCVERS, constants.OCR,)
            if tar_info.name.startswith(extracted_dir_prefixes):
                file.extract(tar_info, path=settings.MEDIA_ROOT)


def restore_data(file_path: str):
    """Restores data from backup archive"""
    restore_db_data(file_path)
    restore_files(file_path)


def restore_user(pyuser: types.User) -> Tuple[models.User, bool]:
    found_user, created_user = None, None
    try:
        found_user = models.User.objects.get(pk=pyuser.id)
    except models.User.ObjectDoesNotExist:
        created_user = models.User(pyuser.model_dump())
        created_user.save()

    if found_user:
        return found_user, False

    return created_user, True


def restore_folder(
    pyfolder: types.Folder,
    user: models.User
) -> Tuple[models.Folder, bool]:
    found_folder, created_folder = None, None
    try:
        found_folder = models.Folder.objects.get(pk=pyfolder.id)
    except models.Folder.ObjectDoesNotExist:
        created_folder = models.Folder(pyfolder.model_dump(), user=user)
        created_folder.save()

    if found_folder:
        return found_folder, False

    return created_folder, True


def restore_document(
    pydoc: types.Document,
    user: models.User
) -> Tuple[models.Document, bool]:
    found_doc, created_doc = None, None
    try:
        found_doc = models.Document.objects.get(pk=pydoc.id)
    except models.Document.ObjectDoesNotExist:
        created_doc = models.Document(pydoc.model_dump(), user=user)
        created_doc.save()

    if found_doc:
        return found_doc, False

    return created_doc, True
