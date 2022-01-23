

class NodesDownloadFile:
    """Creates a file from specified nodes

    Basically it prepares a temporary file which can either a zip/tar.tz or
    can be a single document file.

    It will create one single document file only if in list of nodes provided
    there is one single document node and user asked to include only one version
    of the document (may be original version or last version). In all other
    cases a tar.gz/zip archive, bundling all required files, will be created.

    """
    def __init__(
        self,
        nodes,
        file_name='unnamed',
        include_version='only_last',
        archive_type='zip'
    ):
        self._file_name = file_name
        self._include_version = include_version
        self._archive_type = archive_type
        self._nodes = nodes
        self._create()

    def _create(self):
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
