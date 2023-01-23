import os
import datetime
import logging
import time
import io
import tarfile
import json
from pathlib import PurePath
from os.path import getsize, getmtime, exists

from papermerge.core.storage import abs_path
from .serializers import UserSerializer
from .utils import CType

from papermerge.core.models import User
from papermerge.core.version import __version__ as VERSION

logger = logging.getLogger(__name__)


def relative_link_target(src: str, target: str) -> str:
    """
    Builds link target relative to its source.

    The point of this strage weird utility is to build
    a relative path (PX) so that symbolic link with PX as
    name will point to correct file within tar archive.

    Symbolic link point to something, right?
    That something is called target.
    Well, target is located in different folder, <tar archive>/docs/,
    while symlink itself is located under <tar archive>/<username>/.home/... or
    <tar archive>/<username>/.inbox/...
    This utility build correct path so that symbolic link e.g.
    <tar archive>/john/.home/invoice.pdf will point correctly to the
    file in <tar archive>/docs/X/Y/v1/doc.pdf
    """
    count = len(PurePath(src).parts)
    return os.path.join(
        "../" * count,
        target
    )


def get_content(path: str) -> io.BytesIO:
    """Reads, in binary mode, file content from path

    Returns the content of file as io.BytesIO instance.
    """
    file = open(path, "rb")
    content = file.read()
    file.close()
    return io.BytesIO(content)


class BackupPages:
    """Iterable over document version pages"""
    def __init__(self, version_dict: dict) -> None:
        self._version_dict = version_dict

    def __iter__(self):
        for page in self._version_dict.get('pages', []):
            file_path = page['file_path']
            abs_file_path = abs_path(file_path)
            if exists(abs_file_path):
                content = get_content(abs_file_path)
                entry = tarfile.TarInfo(file_path)
                entry.size = getsize(abs_file_path)
                entry.mtime = getmtime(abs_file_path)
                yield entry, content


class BackupVersions:
    """Iterable over document versions

    For each version the sequence will yield a tuple with three items:
     - tarfile.TarInfo
     - content of the file associated with document version
     - BackupPages sequence instance to continue iteration on the pages
        associated with this version.

    Sequence will yield one extra tuple for the last version of the
    document. In this case tuple will contain three values as follows:
     - tarinfo.TarInfo (with type = tarfile.SYMTYPE)
     - None (no content for symlink)
     - None (no pages for symlink)

    Usage:

    for tar_info, content, pages_seq in BackupVersions(node_dict, prefix):
        # tar_info is instance of tarfile.TarInfo
        # content is instance of io.ByteIO (actual content of file)
        # pages_seq is BackupPages sequence to continue iterating
        # on version pages
        #
        # tar_info can be a regular file, in which case
        # content is not None and pages_seq is not None
        # tar_info can be a symbolic link, in which case
        # content is None and pages_req is None
        ...
    """
    def __init__(self, node_dict: dict, prefix: str):
        """
        Example of node_dict:

            node_dict = {
                'breadcrumb': '.home/My Documents/doc.pdf',
                'ctype': CType.DOCUMENT.value,
                'versions': [
                    {
                        'file_path': 'media/docs/v1/doc.pdf',
                        'number': 1
                    },
                    {
                        'file_path': 'media/docs/v2/doc.pdf',
                        'number': 2
                    }
                ]
            }

        prefix will be prepended to the breadcrumb of the
        node and yielded as symbolic link (tarinfo of type symbolic link)
        """
        self._node_dict = node_dict
        self._prefix = prefix

    def __iter__(self):
        breadcrumb = self._node_dict['breadcrumb']
        versions = self._node_dict.get('versions', [])
        versions_count = len(versions)

        for version in versions:
            src_file_path = version['file_path']
            abs_file_path = abs_path(src_file_path)
            content = get_content(abs_file_path)
            entry = tarfile.TarInfo(src_file_path)
            entry.size = getsize(abs_file_path)
            entry.mtime = getmtime(abs_file_path)
            yield entry, content, BackupPages(version)

            if version['number'] == versions_count:
                # last version
                entry_sym = tarfile.TarInfo(
                    os.path.join(self._prefix, breadcrumb)
                )
                entry_sym.type = tarfile.SYMTYPE
                entry_sym.mtime = getmtime(abs_file_path)
                entry_sym.linkname = relative_link_target(
                    breadcrumb,
                    target=src_file_path
                )
                yield entry_sym, None, None


class BackupNodes:
    """Iterable over users' nodes i.e. documents and folders

    For each of user's nodes (i.e. document or folder) yields
    a tuple, with two items:
        1. `tarfile.TarInfo` - for respective node
        2. instance of `BackupVersions` sequence of respective node
    """

    def __init__(self, backup_dict: dict):
        """Receives as input a dictionary with 'users' key.

        Examples:
        ```
            backup_dict = {
                'users': [
                    {
                        'username': 'user1',
                        'nodes': [
                            {
                                'breadcrumb': '.home',
                                'ctype': CType.FOLDER.value
                            },
                            {
                                'breadcrumb': '.inbox',
                                'ctype': CType.FOLDER.value
                            },
                        ]
                    }
                ]
            }
        """
        self._backup_dict = backup_dict or {}

    def __iter__(self):
        for user in self._backup_dict.get('users', []):
            username = user['username']
            nodes = user['nodes']
            for node in nodes:
                entry = tarfile.TarInfo(
                    os.path.join(username, node['breadcrumb'])
                )
                entry.mtime = time.time()
                entry.mode = 16893
                if node['ctype'] == CType.FOLDER.value:
                    entry.type = tarfile.DIRTYPE

                yield entry, BackupVersions(node, prefix=username)


def dump_data_as_dict() -> dict:
    result_dict = dict()
    result_dict['created'] = datetime.datetime.now().strftime(
        "%d.%m.%Y-%H:%M:%S"
    )
    result_dict['version'] = VERSION
    result_dict['users'] = UserSerializer(User.objects, many=True).data

    return result_dict


def backup_data(file_path: str):
    """Builds backup archive

    Backup archive contains:
        1. all document versions
        2. all pages svg files (user as preview with OCR layer)
        3. preserved folder/document structure as end user sees it

    Point 3. is there only for ease of human readability of
    backup archive.
    """
    dict_data = dump_data_as_dict()
    with tarfile.open(file_path, mode="w:gz") as file:
        for node_tar_info, versions in BackupNodes(dict_data):
            if node_tar_info.isdir():
                file.addfile(node_tar_info)
                continue
            for ver_tar_info, ver_content, pages in versions:
                if ver_tar_info.issym():
                    # last version of the document is added as
                    # symbolic link
                    file.addfile(ver_tar_info)
                    continue
                # non symbolic link
                file.addfile(ver_tar_info, ver_content)
                for page_tar_info in pages:
                    file.addfile(*page_tar_info)

        json_bytes = json.dumps(
            dict_data,
            indent=4,
            default=str
        ).encode('utf-8')

        tarinfo = tarfile.TarInfo('backup.json')
        tarinfo.size = len(json_bytes)
        tarinfo.mtime = time.time()

        file.addfile(tarinfo, io.BytesIO(json_bytes))
