from itertools import chain
import datetime
import logging
import time
import io
import os
import tarfile
import json
from importlib.metadata import distribution

from papermerge.core.serializers import NodeSerializer
from .serializers import UserSerializer, TagSerializer

from papermerge.core.models import (
    User,
    Tag,
    BaseTreeNode,
)

logger = logging.getLogger(__name__)


class UserDataIter:

    def __init__(self, user: User = None):
        self._user = user

    def __iter__(self):
        if self._user is None:
            for user in User.objects.all():
                user_serializer = UserSerializer(user)
                yield user_serializer.data
        else:
            user_serializer = UserSerializer(self._user)
            yield user_serializer.data


class NodeDataIter:

    def __init__(self, root_node_id: str):
        self._root_node_id = root_node_id

    def __iter__(self):
        node = BaseTreeNode.objects.get(pk=self._root_node_id)
        for node in node.get_descendants():
            node_serializer = NodeSerializer(node)
            yield node_serializer.data


class FileIter:
    """Iterator over all descendants' latest version documents of the node

    Yields a tuple with three items for each descendant of given node, also for
    empty folders:
        1. absolute path to document file
        2. prefixed breadcrumb
        3. boolean value weather node is a folder or a document:
            True - for folders
            False - for documents

    Each breadcrumb is prefixed with given string.
    Only last version of the document is considered.

    Example:

        node = BaseTreeNode.objects.get(pk=pk)
        file_iter = FileIter('user1', node)
        for abs_path, breadcrumb, is_folder in file_iter:
            if is_folder:
                print("{abs_path}, {breadcrumb}, is folder")
            else:
                # is a document
                print("{abs_path}, {breadcrumb}, is document")
    """
    def __init__(self, prefix: str, root_node: BaseTreeNode) -> None:
        self._root_node = root_node
        self._prefix = prefix

    def __iter__(self):
        for node in self._root_node.get_descendants():
            breadcrumb = os.path.join(
                self._prefix,
                node.breadcrumb
            )
            if node.is_document:
                doc_ver = node.document.versions.last()
                yield doc_ver.abs_file_path(), breadcrumb, False
            else:
                yield None, breadcrumb, True


class UserFileIter:
    """Iterator over user's latest version documents.

    If no user instance is provided, will iterate over ALL
    users' files (i.e. over User.objects.all()).

    Yields a tuple with three items for each user's node (also for
    empty folders):
        1. absolute path to document file
        2. breadcrumb prefixed with username
        3. boolean value weather node is a folder or a document:
            True - for folders
            False - for documents

    Only last version of the document is considered.


    Example:

        user = User.objects.get(pk=pk)
        user_file_iter = UserFileIter(user)
        for abs_path, breadcrumb, is_folder in user_file_iter:
            if is_folder:
                print("{abs_path}, {breadcrumb}, is folder")
            else:
                # is a document
                print("{abs_path}, {breadcrumb}, is document")
    """
    def __init__(self, user: User = None):
        if user is None:
            self._users = User.objects.all()
        else:
            self._users = [user]

    def __iter__(self):
        for user in self._users:
            home = user.home_folder
            inbox = user.inbox_folder
            prefix = user.username

            for item in chain(
                FileIter(prefix, home),
                FileIter(prefix, inbox)
            ):
                yield item


def dump_data_as_dict(user: User = None) -> dict:

    result_dict = dict()
    result_dict['created'] = datetime.datetime.now().strftime(
        "%d.%m.%Y-%H:%M:%S"
    )
    result_dict['version'] = distribution('papermerge-core').version
    if user is None:
        result_dict['users'] = UserSerializer(User.objects, many=True).data
    else:
        result_dict['users'] = UserSerializer(user).data
    result_dict['tags'] = TagSerializer(Tag.objects, many=True).data

    return result_dict


def backup_documents(
    file_path: str,
    user: User = None,
):
    dict_data = dump_data_as_dict(user)
    with tarfile.open(file_path, mode="w:gz") as file:
        for abs_path, breadcrumb, is_folder in UserFileIter(user):
            if is_folder:
                # Makes sure that empty folders are include in tar
                # archive as well
                entry = tarfile.TarInfo(breadcrumb)
                entry.type = tarfile.DIRTYPE
                file.addfile(entry)  # include empty folders as well
            else:
                file.add(abs_path, arcname=breadcrumb)

        json_bytes = json.dumps(
            dict_data,
            indent=4,
            default=str
        ).encode('utf-8')

        tarinfo = tarfile.TarInfo(name='backup.json')
        tarinfo.size = len(json_bytes)
        tarinfo.mtime = time.time()

        file.addfile(tarinfo, io.BytesIO(json_bytes))
