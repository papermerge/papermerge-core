import logging
import re
import os

SUPPORTED_EXTENTIONS = re.compile(".*(jpeg|jpg|png|tiff|pdf)$", re.IGNORECASE)

logger = logging.getLogger(__name__)

AUX_DIR_DOCS = "docs"
AUX_DIR_SIDECARS = "sidecars"


def filter_by_extention(
    names_list,
    compiled_reg_expr=SUPPORTED_EXTENTIONS
):
    """
    input:
        names_list
            is a list/tubple with string entries.
        compiled_reg_expr
            compiled regular expression pattern for file extentions to filter.
            Only file names of whom extentions match compiled_reg_expr
            will stay in returned list

    returns another list containing only entries with extention
    matching given pattern.
    """
    result = []

    for name in names_list:
        root, ext = os.path.splitext(name)
        if compiled_reg_expr.match(ext):
            result.append(name)

    return result


class DocumentPath:
    """
    Document path:
    /<aux_dir>/<user_id>/<doc_id>/<version>/<file_name>

    If version = 0, it is not included in DocumentPath.
    Document's version is incremented everytime pdftk operation runs on it
    (when pages are deleted, reordered, pasted)
    """

    def __init__(
        self,
        user_id,
        document_id,
        file_name,
        aux_dir=AUX_DIR_DOCS,
        version=0
    ):
        self.user_id = user_id
        self.document_id = document_id
        self.file_name = file_name
        self.aux_dir = aux_dir
        # by default, document has version 0
        self.version = version
        self.pages = "pages"

    @property
    def url(self):
        return f"{self.dirname()}{self.file_name}"

    @property
    def path(self):
        return self.url

    @property
    def dirname_docs(self):
        _path = (
            f"{AUX_DIR_DOCS}/user_{self.user_id}/"
            f"document_{self.document_id}/"
        )

        return _path

    @property
    def dir_sidecars(self):
        _path = (
            f"{AUX_DIR_SIDECARS}/user_{self.user_id}/"
            f"document_{self.document_id}/"
        )

        return _path

    def dirname_sidecars(self, version=None):
        if version is None:
            version = self.version

        _path = (
            f"{AUX_DIR_SIDECARS}/user_{self.user_id}/"
            f"document_{self.document_id}/v{self.version}/pages/"
        )

        return _path

    def dirname(self):

        full_path = (
            f"{self.aux_dir}/user_{self.user_id}/"
            f"document_{self.document_id}/"
        )

        if self.version > 0:
            full_path = f"{full_path}v{self.version}/"

        return full_path

    def pages_dirname(self):
        return f"{self.dirname()}{self.pages}/"

    def __repr__(self):
        message = (
            f"DocumentPath(version={self.version},"
            f"user_id={self.user_id},"
            f"document_id={self.document_id},"
            f"file_name={self.file_name})"
        )
        return message

    def inc_version(self):
        self.version = self.version + 1

    def copy_from(doc_path, **kw):
        """
        Will create a copy of provided
        DocumentPath (first parameter = doc_path) and replace
        existing parameter of new copy with the one from kw.

        kw => key/value parameters.
        Keys can be one of doc_path attributes: user_id, document_id,
        file_name, aux_dir, version
        """
        copy_values = {
            'user_id': doc_path.user_id,
            'document_id': doc_path.document_id,
            'file_name': doc_path.file_name,
            'version': doc_path.version,
            'aux_dir': doc_path.aux_dir

        }
        for key, value in kw.items():
            copy_values[key] = kw[key]

        return DocumentPath(
            user_id=copy_values['user_id'],
            document_id=copy_values['document_id'],
            file_name=copy_values['file_name'],
            version=copy_values['version'],
            aux_dir=copy_values['aux_dir']
        )


class PagePath:
    """
    <aux_dir>/<doc_id>/pages/<page_num>/page-<xyz>.jpg
    """

    def __init__(
        self,
        document_path,
        page_num
    ):
        if not isinstance(page_num, int):
            msg_err = f"PagePath.page_num must be an int. Got {page_num}."
            raise ValueError(msg_err)

        self.document_path = document_path
        self.results_document_ep = DocumentPath.copy_from(
            document_path,
            aux_dir=AUX_DIR_SIDECARS
        )
        self.page_num = page_num
        self.pages = self.document_path.pages

    @property
    def ppmroot(self):
        # returns schema://.../<doc_id>/pages/<page_num>/
        pages_dirname = self.results_document_ep.pages_dirname()
        return f"{pages_dirname}{self.page_num:06d}"

    @property
    def pages_dirname(self):
        return self.document_path.pages_dirname()

    @property
    def path(self):
        return self.url

    @property
    def url(self):
        return self.txt_url

    @property
    def txt_path(self):
        return self.txt_url

    @property
    def txt_url(self):
        pages_dirname = self.results_document_ep.pages_dirname()
        number = f"{self.page_num:06d}"
        return f"{pages_dirname}{number}/{number}_ocr_hocr.txt"

    @property
    def svg_path(self):
        return self.svg_url

    @property
    def svg_url(self):
        dirname = self.results_document_ep.pages_dirname()
        number = f"{self.page_num:06d}"
        url = f"{dirname}/{number}/{number}_ocr.svg"
        return url

    @property
    def jpg_path(self):
        return self.jpg_url

    @property
    def jpg_ocr_url(self):
        # path to jpg image creating using OCRmyPDF
        pages_dirname = self.results_document_ep.pages_dirname()
        url = f"{pages_dirname}{self.page_num:06}_ocr.jpg"
        return url

    @property
    def jpg_url(self):
        # Path to jpg image creating using pikepdf's  extract_image API
        # notice it does not include '_ocr' suffix
        pages_dirname = self.results_document_ep.pages_dirname()
        url = f"{pages_dirname}{self.page_num:06}.jpg"
        return url

    @property
    def hocr_path(self):
        return self.hocr_url

    @property
    def hocr_url(self):
        pages_dirname = self.results_document_ep.pages_dirname()
        url = f"{pages_dirname}{self.page_num:06}_ocr_hocr.hocr"
        return url

    @property
    def preview_url(self):
        pages_dirname = self.results_document_ep.pages_dirname()
        return f"{pages_dirname}001-{self.page_num}.jpg"
