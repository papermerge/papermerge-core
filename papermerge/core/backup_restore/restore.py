import json
import logging
import tarfile
from typing import Tuple

from django.conf import settings

from papermerge.core import constants, models
from papermerge.core.backup_restore import types

from .utils import breadcrumb_to_path, mkdirs

logger = logging.getLogger(__name__)


def restore_db_data(file_path: str) -> None:
    with tarfile.open(file_path, mode="r:gz") as file:
        backup_json = file.extractfile('backup.json')
        backup_info = json.load(backup_json)

        if 'users' not in backup_info:
            raise ValueError("'users' key is missing")

        restore_users(backup_info['users'])


def restore_users(users_data: list[dict] | list[types.User]):
    for user_data in users_data:
        if isinstance(user_data, types.User):
            pyuser = user_data
        else:
            pyuser = types.User(**user_data)

        user, created = restore_user(pyuser)
        if not created:
            logger.info(f"User: {user} already exists")

        for node in pyuser.nodes:
            if getattr(node, 'versions', None):
                restore_document(node, user)
            else:
                # node is a Folder
                restore_folder(node, user)

        for tag in pyuser.tags:
            restore_tag(tag, user)


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
        found_user = models.User.objects.get(username=pyuser.username)
    except models.User.DoesNotExist:
        created_user = models.User(
            **pyuser.model_dump(exclude={'nodes', 'tags'})
        )
        created_user.save()

    if found_user:
        return found_user, False

    return created_user, True


def restore_folder(
    pyfolder: types.Folder,
    user: models.User
) -> Tuple[models.Folder, bool]:
    found_folder, created_folder = None, None
    breadcrumb = breadcrumb_to_path(pyfolder.breadcrumb)

    try:
        found_folder = models.Folder.objects.get_by_breadcrumb(
            str(breadcrumb),
            user=user
        )
    except models.Folder.DoesNotExist:
        if pyfolder.title == models.Folder.HOME_TITLE:
            return user.home_folder, False

        if pyfolder.title == models.Folder.INBOX_TITLE:
            return user.inbox_folder, False

        parent = mkdirs(breadcrumb.parent, user)
        created_folder = models.Folder(
            **pyfolder.model_dump(exclude={"breadcrumb"}),
            user=user,
            parent=parent
        )
        created_folder.save()

        created_folder.basetreenode_ptr.tags.set(
            [tag.name for tag in pyfolder.tags],
            tag_kwargs={"user": user}
        )

    if found_folder:
        return found_folder, False

    return created_folder, True


def restore_document(
    pydoc: types.Document,
    user: models.User
) -> Tuple[models.Document, bool]:
    found_doc, created_doc = None, None
    breadcrumb = breadcrumb_to_path(pydoc.breadcrumb)
    try:
        found_doc = models.Document.objects.get_by_breadcrumb(
            breadcrumb=str(breadcrumb),
            user=user
        )
    except models.Document.DoesNotExist:
        parent = mkdirs(breadcrumb.parent, user)
        created_doc = models.Document(
            **pydoc.model_dump(exclude={"breadcrumb", "versions"}),
            user=user,
            parent=parent
        )
        created_doc.save()
        for pyversion in pydoc.versions:
            ver = models.DocumentVersion(
                **pyversion.model_dump(exclude={"pages"}),
                document=created_doc
            )
            ver.save()
            for pypage in pyversion.pages:
                page = models.Page(**pypage.model_dump(), document_version=ver)
                page.save()

        created_doc.basetreenode_ptr.tags.set(
            [tag.name for tag in pydoc.tags],
            tag_kwargs={"user": user}
        )

    if found_doc:
        return found_doc, False

    return created_doc, True


def restore_tag(
    pytag: types.Tag,
    user: models.User
) -> Tuple[models.Tag, bool]:
    found_tag, created_tag = None, None

    try:
        found_tag = models.Tag.objects.get(name=pytag.name, user=user)
    except models.Tag.DoesNotExist:
        created_tag = models.Tag(**pytag.model_dump(), user=user)
        created_tag.save()

    if found_tag:
        return found_tag, False

    return created_tag, True
