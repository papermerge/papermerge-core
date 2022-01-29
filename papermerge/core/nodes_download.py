import os
import zipfile
import tarfile

from django.core.files.temp import NamedTemporaryFile

from papermerge.core.models import Document, BaseTreeNode
from papermerge.core.serializers.node import (
    ONLY_ORIGINAL,
    ONLY_LAST,
    ZIP
)


class NodesDownload:
    """
    Base class for different types of nodes download:
        * document file (e.g. invoice.pdf)
        * zip archive (e.g. my_invoices.zip)
        * targz archive (e.g. my_invoices.tar.gz
    """
    def __init__(
        self,
        node_ids,
        file_name=None,
        include_version=ONLY_LAST
    ):
        self._file_name = file_name
        self._include_version = include_version
        self._node_ids = node_ids

    def _create(self):
        raise Exception("Not Implemented")

    def get_content(self):
        file_handle = self._create()
        file_handle.seek(0)
        data = file_handle.read()
        file_handle.close()

        return data

    def wants_only_orignal(self):
        return self._include_version == ONLY_ORIGINAL

    def wants_only_last(self):
        return self._include_version == ONLY_LAST

    def _recursive_create_archive(self, archive, node_ids, abspath):
        for node in BaseTreeNode.objects.filter(id__in=node_ids):
            if node.is_document():
                arcname = os.path.join(*abspath, node.idified_title)
                if self.wants_only_last():
                    doc_version = node.versions.last()
                else:
                    doc_version = node.versions.first()

                self.archive_add(
                    archive=archive,
                    abs_file_path=doc_version.abs_file_path(),
                    arcname=arcname
                )
            else:
                child_ids = [child.id for child in node.get_children()]
                self._recursive_create_archive(
                    archive,
                    child_ids,
                    abspath + [node.idified_title]
                )

    def archive_add(self, abs_file_path, arcname):
        raise Exception("Not Implemented")

    @property
    def file_name(self):
        raise Exception("Not Implemented")

    @property
    def content_type(self):
        raise Exception("Not Implemented")

    @property
    def content_disposition(self):
        return f"attachment; filename={self.file_name}"


class NodesDownloadZip(NodesDownload):
    """
    Creates zip archive from a list of nodes. It preserves folder structure.

    Usage:

    nodes_download = NodesDownloadZip(
        node_ids=[1, 2, 3],
        file_name="archive.zip",
        include_version="only_last"
    )

    # returns zip archives content (as bytes)
    data = nodes_download.get_content()
    """
    def _create(self):
        temp_file_obj = NamedTemporaryFile(prefix='download_')
        archive = zipfile.ZipFile(temp_file_obj, mode='w')
        self._recursive_create_archive(
            archive=archive,
            node_ids=self._node_ids,
            abspath=[]
        )
        temp_file_obj.seek(0)
        return temp_file_obj

    def archive_add(self, archive, abs_file_path, arcname):
        archive.write(abs_file_path, arcname=arcname)

    @property
    def file_name(self):
        if self._file_name:
            return self._file_name

        return "archive.zip"

    @property
    def content_type(self):
        return "application/zip"

    def __str__(self):
        return f'NodesDownloadZip(node_ids={self._node_ids})'


class NodesDownloadTarGz(NodesDownload):
    """
    Creates targz archive from a list of nodes. It preserves folder structure.

    Usage:

    nodes_download = NodesDownloadTarGz(
        node_ids=[1, 2, 3],
        file_name="archive.tar.gz",
        include_version="only_last"
    )

    # returns tar.gz archives content (as bytes)
    data = nodes_download.get_content()
    """
    def _create(self):
        temp_file_obj = NamedTemporaryFile(prefix='download_')
        archive = tarfile.open(temp_file_obj.name, mode='w:gz')
        self._recursive_create_archive(
            archive=archive,
            node_ids=self._node_ids,
            abspath=[]
        )
        temp_file_obj.seek(0)
        return temp_file_obj

    def archive_add(self, archive, abs_file_path, arcname):
        archive.add(abs_file_path, arcname=arcname)

    @property
    def file_name(self):
        if self._file_name:
            return self._file_name

        return "archive.tar.gz"

    @property
    def content_type(self):
        return "application/x-gtar"

    def __str__(self):
        return f'NodesDownloadTarGz(node_ids={self._node_ids})'


class NodesDownloadDocument(NodesDownload):
    """
    Returns document file data of the document in node_ids[0].

    Note that node_ids must have only one item in the list.

    Usage:

    nodes_download = NodesDownloadDocument(
        node_ids=[1],
        include_version="only_last"
    )

    # returns document's last version file content (as bytes)
    data = nodes_download.get_content()
    """
    def _create(self):
        abs_path = self.get_document_file_abs_path()
        return open(abs_path, 'rb')

    def get_document_version(self):
        doc = Document.objects.get(pk=self._node_ids[0])
        if self.wants_only_last():
            return doc.versions.last()

        return doc.versions.first()

    def get_document_file_abs_path(self):
        """Returns the absolute path to the document file to be downloaded"""
        doc_version = self.get_document_version()
        abs_file_path = doc_version.abs_file_path()

        return abs_file_path

    @property
    def file_name(self):
        if self._file_name:
            return self._file_name

        doc_version = self.get_document_version()
        return doc_version.file_name

    @property
    def content_type(self):
        # TODO: add correct content type depending on the
        # document file
        return "application/pdf"

    def __str__(self):
        return f'NodesDownloadDocument(node_ids={self._node_ids})'

    def __repr__(self):
        return str(self)


def is_single_document_node(node_ids, include_version):
    """
    Returns True only if all following conditions are True:
        * node_ids has only one item
        * include_version is either 'only_last' or 'only_original'
        * Document model referenced by ID=node_ids[0] exists

    Returns False if one of above conditions is False.

    :param node_ids: list of node IDs
    :param include_version: a list of strings
    :return:
    """
    if len(node_ids) == 1 and include_version in (ONLY_LAST, ONLY_ORIGINAL):
        return Document.objects.filter(pk=node_ids[0]).exists()

    return False


def get_nodes_download(
    node_ids,
    file_name=None,
    include_version=ONLY_LAST,
    archive_type=ZIP
):
    """
    Helper function which returns correct instance/version
    of NodesDownload class

    Arguments:

    * `node_ids` a list of node IDs to download
    * `file_name` file name of end archive/document file
    * `include_version` can be either 'only_last' or 'only_original'
    * `archive_type` can be either 'zip' or 'targz'

    Returns:
        NodesDownloadDocument or NodesDownloadZip or NodesDownloadTarGzFile
        instance depending on the content of `node_ids` and `include_version`
        arguments
    """
    if is_single_document_node(node_ids, include_version):
        return NodesDownloadDocument(
            node_ids=node_ids,
            file_name=file_name,
            include_version=include_version
        )

    if archive_type == ZIP:
        return NodesDownloadZip(
            node_ids,
            file_name,
            include_version=include_version
        )

    return NodesDownloadTarGz(
        node_ids,
        file_name,
        include_version=include_version
    )
