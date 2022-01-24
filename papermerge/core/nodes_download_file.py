import os
import zipfile

from django.core.files.temp import NamedTemporaryFile

from papermerge.core.models import Document, BaseTreeNode
from papermerge.core.serializers.node import (
    ONLY_ORIGINAL,
    ONLY_LAST,
    ZIP,
    TARGZ
)


class NodesDownloadFile:
    """Prepares a temporary file which can either a zip/tar.tz or can be a
    single document file.

    It will create one single document file only if in list of nodes provided
    there is one single document node and user asked to include only one version
    of the document (may be original version or last version). In all other
    cases a tar.gz/zip archive, bundling all required files, will be created.

    Usage example:

        download = NodesDownloadFile(
            node_ids=[1],
            file_name='invoice.pdf'
        )

        download = NodesDownloadFile(
            node_ids=[1, 2, 3],
            file_name='my_documents.zip',
            archive_type='zip',
            include_version='only_last'
        )
    """
    def __init__(
        self,
        node_ids,
        file_name='unnamed',
        include_version=ONLY_LAST,
        archive_type=ZIP
    ):
        self._file_name = file_name
        self._include_version = include_version
        self._archive_type = archive_type
        self._node_ids = node_ids
        self._file_handle = self._create()

    def _create(self):
        if self.is_single_document_node():
            # nothing to create here, just return
            # opened file handle of already existing file document
            abs_path = self._get_document_file_abs_path()
            return open(abs_path, 'rb')

        if self.wants_zip():
            return self._create_zip()

        self._create_targz()

    def wants_zip(self):
        return self._archive_type == ZIP

    def wants_targz(self):
        return self._archive_type == TARGZ

    def is_single_node(self):
        return len(self._node_ids) == 1

    def is_single_document_node(self):
        """True only of downloaded file will be a single document file
        i.e. downloaded file won't be a zip/targz archive with multiple
        files bundled in it
        """
        if self.is_single_node() and self.wants_only_one_version():
            return Document.objects.filter(pk=self._node_ids[0]).exists()

        return False

    def _get_document_file_abs_path(self):
        """Returns the absolute path to the document file to be downloaded"""
        if not self.is_single_document_node():
            raise Exception("Not a single document node")

        doc = Document.objects.get(pk=self._node_ids[0])

        if self.wants_only_last():
            doc_version = doc.versions.last()
        elif self.wants_only_orignal():
            doc_version = doc.versions.first()

        abs_file_path = doc_version.abs_file_path()

        return abs_file_path

    def wants_only_one_version(self):
        return self.wants_only_last() or self.wants_only_orignal()

    def wants_only_orignal(self):
        return self._include_version == ONLY_ORIGINAL

    def wants_only_last(self):
        return self._include_version == ONLY_LAST

    def _create_zip(self):
        temp_file_obj = NamedTemporaryFile(prefix='download_')
        archive = zipfile.ZipFile(temp_file_obj, mode='w')
        self._recursive_create_zip(
            archive=archive,
            node_ids=self._node_ids,
            abspath=[]
        )
        temp_file_obj.seek(0)
        return temp_file_obj

    def _recursive_create_zip(self, archive, node_ids, abspath):
        for node in BaseTreeNode.objects.filter(id__in=node_ids):
            if node.is_document():
                arcname = os.path.join(*abspath, node.title)
                doc_version = node.versions.last()
                archive.write(
                    doc_version.abs_file_path(),
                    arcname=arcname
                )
            else:
                child_ids = [child.id for child in node.get_children()]
                self._recursive_create_zip(
                    archive,
                    child_ids,
                    abspath + [node.title]
                )

    def _create_targz(self):
        pass

    @property
    def file_handle(self):
        if not self._file_handle:
            raise Exception("Download file not yet available")

        return self._file_handle

    @property
    def file_name(self):
        return self._file_name

    def __str__(self):
        return f'NodesDownloadFile(node_ids={self._node_ids})'

    def __repr__(self):
        return str(self)
