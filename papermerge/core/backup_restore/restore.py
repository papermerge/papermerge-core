import logging
import io
import os
import tarfile
import json
from pathlib import PurePath

from django.core.files.temp import NamedTemporaryFile

from papermerge.core.serializers import UserSerializer, TagSerializer
from papermerge.core.lib.pagecount import get_pagecount

from papermerge.core.models import (
    Document,
    User,
    Folder,
    Tag,
)
from papermerge.core.storage import default_storage
from papermerge.core.utils import remove_backup_filename_id
from papermerge.core.tasks import ocr_document_task

logger = logging.getLogger(__name__)


def restore_documents(
    restore_file: io.BytesIO,
    user: User,
    skip_ocr=False
):

    restore_file.seek(0)

    with tarfile.open(fileobj=restore_file, mode="r") as restore_archive:
        backup_json = restore_archive.extractfile('backup.json')
        backup_info = json.load(backup_json)

        leading_user_in_path = False
        _user = user
        if not user:
            leading_user_in_path = True
            # user was not specified. It is assument that
            # backup.json contains a list of users.
            # Thus recreate users first.
            for backup_user in backup_info['users']:
                user = User.objects.create(
                    username=backup_user['username'],
                    email=backup_user['email'],
                    is_active=backup_user['is_active'],
                    is_superuser=backup_user['is_superuser']
                )
                # in case --include-user-password switch was used
                # update user (raw digest of) password field
                password = backup_user.get('password')
                if password:
                    user.password = password
                    user.save()

        for restore_file in restore_archive.getnames():

            if restore_file == "backup.json":
                continue

            logger.debug(f"Restoring file {restore_file}...")

            splitted_path = PurePath(restore_file).parts
            base, ext = os.path.splitext(
                remove_backup_filename_id(splitted_path[-1])
            )

            # if there is leading username, remove it.
            if leading_user_in_path:
                username = splitted_path[0]
                _user = User.objects.get(username=username)
                splitted_path = splitted_path[1:]

            if backup_info.get('documents', False):
                backup_info_documents = backup_info['documents']
            else:
                backup_info_documents = _get_json_user_documents_list(
                    backup_info,
                    _user
                )
                leading_user_in_path = True

            for info in backup_info_documents:
                document_info = info
                if info['path'] == restore_file:
                    break

            parent = None

            # variables used only to shorten debug message
            _sp = splitted_path
            _rf = restore_file
            logger.debug(
                f"{_rf}: splitted_path={_sp} len(splitted_path)={len(_sp)}"
            )
            # we first have to create a folder structure
            if len(splitted_path) > 1:
                for folder in splitted_path[:-1]:

                    folder_object = Folder.objects.filter(
                        title=folder,
                        user=_user
                    ).filter(parent=parent).first()

                    if folder_object is None:
                        new_folder = Folder.objects.create(
                            title=folder,
                            parent=parent,
                            user=_user
                        )
                        parent = new_folder
                    else:
                        parent = folder_object

            with NamedTemporaryFile("w+b", suffix=ext) as temp_output:
                logger.debug(f"Extracting {restore_file}...")

                ff = restore_archive.extractfile(restore_file)
                temp_output.write(
                    ff.read()
                )
                temp_output.seek(0)
                size = os.path.getsize(temp_output.name)

                page_count = get_pagecount(temp_output.name)

                if parent:
                    parent_id = parent.id
                else:
                    parent_id = None

                new_doc = Document.objects.create_document(
                    user=_user,
                    title=document_info['title'],
                    size=size,
                    lang=document_info['lang'],
                    file_name=remove_backup_filename_id(splitted_path[-1]),
                    parent_id=parent_id,
                    notes="",
                    page_count=page_count,
                    rebuild_tree=False  # speeds up 100x
                )

                tag_attributes = document_info.get('tags', [])

                for attrs in tag_attributes:
                    attrs['user'] = _user
                    tag, created = Tag.objects.get_or_create(**attrs)
                    new_doc.tags.add(tag)

                default_storage.copy_doc(
                    src=temp_output.name,
                    dst=new_doc.path().url()
                )

            if not skip_ocr:
                ocr_document_task.apply_async(kwargs={
                    'user_id': _user.id,
                    'document_id': new_doc.id,
                    'file_name': new_doc.file_name,
                    'lang': document_info['lang']}
                )


def _can_restore(restore_file: io.BytesIO):
    with tarfile.open(fileobj=restore_file, mode="r") as restore_archive:
        backup_json = restore_archive.extractfile('backup.json')
        if backup_json is None:
            return False
        current_backup = json.load(backup_json)

        if current_backup.get('version') is not None:
            return True


def _is_valid_user(username: str):
    current_user = User.objects.filter(username=username).first()
    if current_user is not None:
        return True
    else:
        return False


def _get_json_user_documents_list(json_backup: dict, user: User):
    for _u in json_backup['users']:
        if _u['username'] == user.username:
            return _u['documents']

    return None


def breadcrumb_parts_count(item: dict[str, str]) -> int:
    """
    Returns parts count of the breadcrumb.

    Item is a dictionary with at least one key 'breadcrumb'.
    Example of items:
        item = {"breadcrumb": "A/"}  - one parts breadcrumb
        item = {"breadcrumb": "A/B/"}  - two parts breadcrumb
        item = {"breadcrumb": "A/B/C/"}  - three parts breadcrumb
        item = {"breadcrumb": "A/doc.pdf"}  - two parts breadcrumb

    Note that breadcrumb path to a folder always ends with '/' character.
    """
    return len(PurePath(item['breadcrumb']).parts)


class RestoreSequence:
    """
    Sequence which iterates over nodes in 'correct' order.

    The whole point of RestoreSequence is to iterate over nodes
    in such order that guarantees that parent node is yielded
    BEFORE child node.
    Even though nodes are stored in a list, they are hierarchical.
    The hierarchy is expressed by 'breadcrumb' key.
    Example:
        Following hierarchy:

            - .home  # level 1
              - doc.pdf
              - My Docs  # level 2
                - doc1.pdf  # level 3
                - doc2.pdf
              - My Invoices
                - inv.pdf
            - .inbox

        My be expressed as [
            {'breadcrumb': '.home/'},
            {'breadcrumb': '.home/My Docs/'},
            {'breadcrumb': '.home/My Docs/doc1.pdf'},
            {'breadcrumb': '.home/My Docs/doc2.pdf'},
            {'breadcrumb': '.home/My Invoices/'},
            {'breadcrumb': '.home/My Invoices/inv.pdf'},
            {'breadcrumb': '.inbox/'},
        ]
        The 'correct' order by which RestoreSequence iterates is higher level
        nodes comes before lower level nodes.
        Sticking to example from above, Restore sequence will iterate
        in following order:
            {'breadcrumb': '.home/'},   # level 1
            {'breadcrumb': '.inbox/'},  # level 1
            {'breadcrumb': '.home/My Docs/'},  # level 2
            {'breadcrumb': '.home/My Invoices/'},  # level 2
            {'breadcrumb': '.home/doc.pdf'},  # level 2
            {'breadcrumb': '.home/My Docs/doc1.pdf'}  # level 3
            {'breadcrumb': '.home/My Docs/doc2.pdf'}   # level 3
            {'breadcrumb': '.home/My Invoices/inv.pdf'}  # level 3

        It is very important to understand that on same level folders are
        yielded before documents.
        If breadcrumb string ends with '/' characters - it means that given
        nodes is a folder.
    """
    def __init__(self, nodes: list[dict]):
        self._nodes = nodes

    def __iter__(self):
        for node in sorted(self._nodes, key=breadcrumb_parts_count):
            yield node


def restore_user(user_dict: dict) -> User:
    user_ser = UserSerializer(data=user_dict)
    if user_ser.is_valid():
        user_ser.save()

    return User.objects.get(username=user_dict['username'])


def restore_document(node_dict, user, tar_file):
    keys = ['lang', 'ocr', 'ocr_status', 'tags', 'created_at', 'updated_at']
    sanitized_dict = {v: node_dict[v] for v in keys}
    breadcrumb = PurePath(node_dict.pop('breadcrumb'))
    title = breadcrumb.name
    Document.objects.create_document(
        title=title,
        user=user,
        **sanitized_dict
    )


def restore_folder(node_dict: dict[str, str], user: User) -> Folder:
    """
    Creates leaf folder of the given breadcrumb.

    The only required key in the dictionary is `breadcrumb`.
    `breadcrumb` describes the path to folder we want to restore.
    e.g. if node_dict['breadcrumb'] = 'A/B/C/', method will
    create and return folder 'C'.
    Note that parent folder 'B' must exist apriori!
    """
    breadcrumb = PurePath(node_dict.pop('breadcrumb'))
    keys = ['tags', 'created_at', 'updated_at']
    sanitized_dict = {v: node_dict[v] for v in keys}

    title = breadcrumb.name
    parent_path = str(breadcrumb.parent)

    parent = Folder.objects.get_by_breadcrumb(parent_path)
    return Folder.objects.create(
        user=user,
        parent=parent,
        title=title,
        **sanitized_dict
    )


def restore_node(node_dict: dict, user: User, tar_file) -> None:
    """Restores given node"""
    if 'ocr' not in node_dict.keys():  # documents have OCR key
        restore_folder(node_dict, user)
    else:
        restore_document(node_dict, user, tar_file)


def restore_documents2(file_path: str):

    with tarfile.open(file_path, mode="r:gz") as file:
        backup_json = file.extractfile('backup.json')
        backup_info = json.load(backup_json)

        if 'users' not in backup_info:
            raise ValueError("'users' key is missing")

        for user_data in backup_info['users']:
            if 'nodes' not in user_data:
                raise ValueError("'nodes' key not found in 'users'")
            restore_seq = RestoreSequence(user_data.pop('nodes'))
            user = restore_user(user_data)

            for node_dict in restore_seq:
                restore_node(node_dict, user=user, tar_file=file)

        for tag_data in backup_info['tags']:
            tag_ser = TagSerializer(data=tag_data)
            if tag_ser.is_valid():
                tag_ser.save()
