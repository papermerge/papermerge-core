import io
import json
import logging
import os
import tarfile
import time
from os.path import exists, getmtime, getsize
from pathlib import PurePath

from papermerge.core.models import User
from papermerge.core.pathlib import (abs_docver_path, docver_path,
                                     page_file_type_path)

from .types import Backup
from .types import Document as DocumentSerializer
from .types import DocumentVersion as DocumentVersionSerializer
from .types import Folder as FolderSerializer
from .types import User as UserSerializer
from .utils import CType, breadcrumb_to_path

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
    def __init__(self, version: DocumentVersionSerializer) -> None:
        self._version = version

    def __iter__(self):
        for page in self._version.pages:
            for page_path, abs_page_path in page_file_type_path():
                file_path = str(page_path(page.id))
                abs_file_path = str(abs_page_path(page.id))
                if exists(abs_file_path):
                    entry, content = self.get_entry_content(
                        abs_file_path, file_path
                    )
                    yield entry, content

    def get_entry_content(self, abs_file_path: str, file_path: str):
        content = get_content(abs_file_path)
        entry = tarfile.TarInfo(file_path)
        entry.size = getsize(abs_file_path)
        entry.mtime = getmtime(abs_file_path)

        return entry, content


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
    def __init__(
        self,
        node: FolderSerializer | DocumentSerializer,
        prefix: str
    ):
        """
        prefix will be prepended to the breadcrumb of the
        node and yielded as symbolic link (tarinfo of type symbolic link)
        """
        self._node = node
        self._prefix = prefix

    def __iter__(self):
        breadcrumb = breadcrumb_to_path(self._node.breadcrumb)
        versions = getattr(self._node, 'versions', [])
        versions_count = len(versions)

        for version in versions:
            src_file_path = docver_path(
                str(version.id),
                str(version.file_name)
            )
            abs_file_path = abs_docver_path(
                str(version.id),
                str(version.file_name)
            )
            content = get_content(abs_file_path)
            entry = tarfile.TarInfo(str(src_file_path))
            entry.size = getsize(abs_file_path)
            entry.mtime = getmtime(abs_file_path)
            yield entry, content, BackupPages(version)

            if version.number == versions_count:
                # last version
                path = PurePath(self._prefix, breadcrumb)
                entry_sym = tarfile.TarInfo(str(path))
                entry_sym.type = tarfile.SYMTYPE
                entry_sym.mtime = getmtime(abs_file_path)
                entry_sym.linkname = relative_link_target(
                    str(breadcrumb),
                    target=str(src_file_path)
                )
                yield entry_sym, None, None


class BackupNodes:
    """Iterable over users' nodes i.e. documents and folders

    For each of user's nodes (i.e. document or folder) yields
    a tuple, with two items:
        1. `tarfile.TarInfo` - for respective node
        2. instance of `BackupVersions` sequence of respective node
    """

    def __init__(self, backup: Backup):
        self._backup = backup

    def __iter__(self):
        for user in self._backup.users:
            username = user.username
            for node in user.nodes:
                node_path = breadcrumb_to_path(node.breadcrumb)
                file_path = PurePath(username, node_path)
                entry = tarfile.TarInfo(str(file_path))
                entry.mtime = time.time()
                entry.mode = 16893
                if node.ctype == CType.FOLDER.value:
                    entry.type = tarfile.DIRTYPE

                yield entry, BackupVersions(node, prefix=username)

    def __repr__(self):
        return f"BackupNodes(backup={self._backup})"


def get_backup() -> Backup:
    users = [
        UserSerializer(
            username=user.username,
            email=user.email,
            created_at=user.created_at,
            updated_at=user.updated_at,
            password=user.password,
            nodes=user.nodes,
            tags=user.tags
        )
        for user in User.objects.all()
    ]

    return Backup(users=users)


def backup_data(file_path: str):
    """Builds backup archive

    Backup archive contains:
        1. all document versions
        2. all pages svg files (user as preview with OCR layer)
        3. preserved folder/document structure as end user sees it

    Point 3. is there only for ease of human readability of
    backup archive.
    """
    backup = get_backup()
    with tarfile.open(file_path, mode="w:gz") as file:
        for node_tar_info, versions in BackupNodes(backup):
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
            backup.model_dump(),
            indent=4,
            default=str
        ).encode('utf-8')

        tarinfo = tarfile.TarInfo('backup.json')
        tarinfo.size = len(json_bytes)
        tarinfo.mtime = time.time()

        file.addfile(tarinfo, io.BytesIO(json_bytes))
