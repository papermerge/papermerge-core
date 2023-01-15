import os
import datetime
import logging
import time
import io
import tarfile
import json
from pathlib import PurePath
from importlib.metadata import distribution

from papermerge.core.storage import abs_path
from .serializers import UserSerializer, TagSerializer

from papermerge.core.models import (
    User,
    Tag,
)

logger = logging.getLogger(__name__)


def link_name(src, target):
    count = len(PurePath(src).parts)
    return os.path.join(
        "../" * count,
        target
    )


class BackupPages:
    """Iterator over document version pages"""
    def __init__(self, version_dict: dict):
        self._version_dict = version_dict

    def __iter__(self):
        for page in self._version_dict['pages']:
            file_path = page['file_path']
            abs_file_path = abs_path(file_path)
            if os.path.exists(abs_file_path):
                file = open(abs_file_path, 'rb')
                content = file.read()
                entry = tarfile.TarInfo(file_path)
                entry.size = os.path.getsize(abs_file_path)
                yield entry, io.BytesIO(content)
                file.close()


class BackupVersions:
    """Iterator over document versions"""
    def __init__(self, node_dict: dict, prefix: str):
        self._node_dict = node_dict
        self._prefix = prefix

    def __iter__(self):
        breadcrumb = self._node_dict['breadcrumb']
        versions = self._node_dict['versions']
        versions_count = len(versions)

        for version in versions:
            src_file_path = version['file_path']
            abs_file_path = abs_path(src_file_path)
            file = open(abs_file_path, 'rb')
            entry = tarfile.TarInfo(src_file_path)
            content = file.read()
            entry.size = os.path.getsize(abs_file_path)
            yield entry, io.BytesIO(content), BackupPages(version)
            file.close()

            if version['number'] == versions_count:
                # last version
                entry_sym = tarfile.TarInfo(
                    os.path.join(self._prefix, breadcrumb)
                )
                entry_sym.type = tarfile.SYMTYPE
                entry_sym.linkname = link_name(
                    breadcrumb,
                    target=src_file_path
                )
                yield entry_sym, None, None


class BackupNodes:
    """Iterator over users' nodes (documents and folders)"""
    def __init__(self, backup_dict: dict):
        self._backup_dict = backup_dict

    def __iter__(self):
        for user in self._backup_dict['users']:
            username = user['username']
            nodes = user['nodes']
            for node in nodes:
                entry = tarfile.TarInfo(node['breadcrumb'])
                if node['ctype'] == 'folder':
                    entry.type = tarfile.DIRTYPE
                yield entry, BackupVersions(node, prefix=username)


def dump_data_as_dict() -> dict:

    result_dict = dict()
    result_dict['created'] = datetime.datetime.now().strftime(
        "%d.%m.%Y-%H:%M:%S"
    )
    result_dict['version'] = distribution('papermerge-core').version
    result_dict['users'] = UserSerializer(User.objects, many=True).data
    result_dict['tags'] = TagSerializer(Tag.objects, many=True).data

    return result_dict


def backup_documents(file_path: str):
    dict_data = dump_data_as_dict()
    with tarfile.open(file_path, mode="w:gz") as file:
        for node_tar_info, versions in BackupNodes(dict_data):
            if node_tar_info.isdir():
                # file.addfile(ntar_info)
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
