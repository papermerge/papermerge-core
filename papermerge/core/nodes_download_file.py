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
            nodes=[{'id': 1}],
            file_name='invoice.pdf'
        )
    """
    def __init__(
        self,
        nodes,
        file_name='unnamed',
        include_version=ONLY_LAST,
        archive_type=ZIP
    ):
        self._file_name = file_name
        self._include_version = include_version
        self._archive_type = archive_type
        self._nodes = nodes
        self._create()

    def _create(self):
        if self.is_single_document_node():
            # There is nothing to 'create' for a single document node.
            # User will receive/download an already
            # existing file (e.g. invoice.pdf)
            return

        if self.wants_zip():
            return self._create_zip()

        self._create_targz()

    def wants_zip(self):
        return self._archive_type == ZIP

    def wants_targz(self):
        return self._archive_type == TARGZ

    def is_single_node(self):
        return len(self._nodes) == 1

    def is_single_document_node(self):
        if self.is_single_node() and self.wants_only_one_version():
            return Document.objects.exists(pk=self._nodes[0]['id'])

    def wants_only_one_version(self):
        self._include_version in (ONLY_ORIGINAL, ONLY_LAST)

    def _create_zip(self):
        pass

    def _create_targz(self):
        pass

    @property
    def file_handle(self):
        pass

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
