import os.path

from papermerge.core.models import Document
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
            node_ids=[1, 2, 3],
            file_name='invoice.pdf'
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
        self._file_handle = None
        self._create()

    def _create(self):
        if self.is_single_document_node():
            return self._get_document_file_abs_path()

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
        if self.is_single_node() and self.wants_only_one_version():
            return Document.objects.get(pk=self._node_ids[0])

        return False

    def _get_document_file_abs_path(self):
        if not self.is_single_document_node():
            raise Exception("Not a single document node")

        doc = Document.objects.get(pk=self._node_ids[0])

        last_doc_version = doc.versions.last()
        abs_file_path = last_doc_version.abs_file_path()

        return abs_file_path

    def wants_only_one_version(self):
        return self._include_version in (ONLY_ORIGINAL, ONLY_LAST)

    def _create_zip(self):
        pass

    def _create_targz(self):
        pass

    @property
    def file_handle(self):
        if not self._file_handle:
            raise Exception("Download file not yet available")

        return self._file_handle

    @property
    def file_size(self):
        pass

    @property
    def file_name(self):
        return self._file_name

    @property
    def content_type(self):
        return 'application/pdf'

    @property
    def content_disposition(self):
        return f'attachment; filename={self.file_name}'

    def __str__(self):
        return f'NodesDownloadFile(node_ids={self._node_ids})'

    def __repr__(self):
        return str(self)
