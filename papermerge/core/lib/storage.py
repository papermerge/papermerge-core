import io
import logging
import os
import shutil
from os import listdir
from os.path import isdir, join
from pathlib import Path

from .path import AUX_DIR_DOCS, AUX_DIR_SIDECARS, DocumentPath, PagePath
from .utils import safe_to_delete

logger = logging.getLogger(__name__)


class Storage:
    """
    Default Storage class which works with DocumentPath and PagePath
    on local host filesystem
    """

    def __init__(self, location=None, **kwargs):
        # by default, this will be something like
        # settings.MEDIA_ROOT
        self._location = location

    @property
    def location(self):
        return self._location

    def upload(self, doc_path_url, **kwargs):
        pass

    def download(self, doc_path_url, **kwargs):
        pass

    def delete_user_data(self, user_id: str):
        folder1_to_delete = os.path.join(
            self.abspath(AUX_DIR_DOCS),
            f'user_{user_id}'
        )
        folder2_to_delete = os.path.join(
            self.abspath(AUX_DIR_SIDECARS),
            f'user_{user_id}'
        )

        self.safe_delete_folder(folder1_to_delete)
        self.safe_delete_folder(folder2_to_delete)

    def safe_delete_folder(self, abs_path_to_folder_to_delete: str):
        logger.debug(
            f'Safely deleting content of {abs_path_to_folder_to_delete}'
        )
        if safe_to_delete(
            abs_path_to_folder_to_delete
        ):
            shutil.rmtree(abs_path_to_folder_to_delete)
            if os.path.exists(abs_path_to_folder_to_delete):
                os.rmdir(abs_path_to_folder_to_delete)

    def make_sure_path_exists(self, filepath):
        logger.debug(f"make_sure_path_exists {filepath}")
        dirname = os.path.dirname(filepath)
        os.makedirs(
            dirname,
            exist_ok=True
        )

    def get_versions(self, doc_path):
        """
        Returns a list of (all) ordered versions
        of specific doc_path. Versions
        start with 0. Examples of return values:

        - [0, 1, 2, 3] = 4 versions of the document
        - [ 0 ] = only one version (original)

        To count versions it just counts number of subfolders
        in specific document folder. Versions are
        stored in subfolders named v1, v2, v3, ...
        """
        abs_dirname_docs = self.path(
            doc_path.dirname_docs
        )
        try:
            only_dirs = [
                fi for fi in listdir(abs_dirname_docs) if isdir(
                    join(abs_dirname_docs, fi)
                )
            ]
        except FileNotFoundError:
            # in tests, document folders are not always created.
            # If no document folder is found, just return [ 0 ]
            # i.e that document has only one single version and it
            # is the latest one.
            return [0]

        dirs_count = len(only_dirs)

        return list(range(0, dirs_count + 1))

    def get_pagecount(self, doc_path):
        """
        Returns total number of pages for this doc_path.
        Total number of pages = number of page_xy.txt files
        in pages_dirname folder.
        """
        doc_path_pointing_to_results = DocumentPath.copy_from(
            doc_path, aux_dir="results"
        )
        pages_dir = self.abspath(doc_path_pointing_to_results.pages_dirname())

        only_dirs = [
            fi for fi in listdir(pages_dir) if isdir(join(pages_dir, fi))
        ]
        return len(only_dirs)

    def abspath(self, _path):
        if isinstance(_path, DocumentPath):
            return os.path.join(
                self.location, _path.url
            )
        elif isinstance(_path, PagePath):
            return os.path.join(
                self.location, _path.url
            )

        return os.path.join(
            self.location, _path
        )

    def path(self, _path):
        return self.abspath(_path)

    def delete_file(self, file_or_folder: Path):
        # Before recursively deleting everything in folder
        # double check that there are only
        # .pdf, .txt, .hocr, .jpg files.
        if file_or_folder.is_dir() and safe_to_delete(file_or_folder):
            shutil.rmtree(file_or_folder)
            file_or_folder.rmdir()

    def copy_file(self, src: Path | io.BytesIO, dst: Path):
        """Copy source file to destination"""
        logger.debug(f"copying {src} to {dst}")

        if not dst.parent.exists():
            os.makedirs(dst.parent, exist_ok=True)

        if isinstance(src, Path):
            logger.debug(f"{src} is a Path instance")
            shutil.copyfile(src, dst)
        elif isinstance(src, io.BytesIO):
            with open(dst, 'wb') as f:
                f.write(src.getvalue())
        else:
            raise ValueError(
                f"src ({src}) is neither instance of DocumentPath nor io.Bytes"
            )

    def exists(self, _path):
        return os.path.exists(
            self.path(_path)
        )

    def copy_page_txt(self, src: PagePath, dst: PagePath):
        logger.debug(f"copy_page_txt src={src.txt_url} dst={dst.txt_url}")
        src_txt = self.abspath(src.txt_url)
        dst_txt = self.abspath(dst.txt_url)

        self.make_sure_path_exists(
            self.abspath(dst.txt_url)
        )

        shutil.copy(src_txt, dst_txt)

    def copy_page_jpg(self, src: PagePath, dst: PagePath):
        logger.debug(f"copy_page_jpg src={src.jpg_url} dst={dst.jpg_url}")
        src_jpg = self.abspath(src.jpg_url)
        dst_jpg = self.abspath(dst.jpg_url)

        self.make_sure_path_exists(
            self.abspath(dst.jpg_url)
        )
        shutil.copy(src_jpg, dst_jpg)

    def copy_page_hocr(self, src: PagePath, dst: PagePath):
        logger.debug(f"copy_page_hocr: src={src.hocr_url} dst={dst.hocr_url}")
        src_hocr = self.abspath(src.hocr_url)
        dst_hocr = self.abspath(dst.hocr_url)

        self.make_sure_path_exists(
            self.abspath(dst.hocr_url)
        )

        shutil.copy(src_hocr, dst_hocr)

    def copy_page_svg(self, src: PagePath, dst: PagePath):
        logger.debug(f"copy_page_svg: src={src.svg_url} dst={dst.svg_url}")
        src_svg = self.abspath(src.svg_url)
        dst_svg = self.abspath(dst.svg_url)

        self.make_sure_path_exists(self.abspath(dst.svg_url))

        shutil.copy(src_svg, dst_svg)

    def copy_page_preview(self, src: PagePath, dst: PagePath):
        logger.debug(
            f"copy_page_preview: src={src.preview_url} dst={dst.preview_url}"
        )
        src_preview = self.abspath(src.preview_url)
        dst_preview = self.abspath(dst.preview_url)

        self.make_sure_path_exists(self.abspath(dst.preview_url))

        shutil.copy(src_preview, dst_preview)

    def copy_page(self, src_folder: Path, dst_folder: Path):
        """
        Copies page data from source folder to destination folder

        Page data are files with 'txt', 'hocr', 'jpg', 'svg' extentions.
        """
        if not src_folder.is_dir():
            raise ValueError(f"Source is not a folder {src_folder}")

        dst_folder.mkdir(parents=True, exist_ok=True)
        if not dst_folder.is_dir():
            raise ValueError(f"Destination is not a folder {dst_folder}")

        shutil.copytree(src_folder, dst_folder, dirs_exist_ok=True)

    def reorder_pages(self, doc_path, new_order):
        """
        Reorders pages in the document pointed by doc_path.
        doc_path is an instance of mglib.path.DocumentPath

        In case of success returns document's new version.

        new_order is a list of following format:

            [
                {'page_num': 2, page_order: 1},
                {'page_num': 1, page_order: 2},
                {'page_num': 3, page_order: 3},
                {'page_num': 4, page_order: 4},
            ]
        Example above means that in current document of 4 pages,
        first page was swapped with second one.
        page_num    = older page order
        page_order  = current page order
        So in human language, each hash is read:
            <page_num> now should be <page_order>
        """
        src_doc_path = doc_path
        dst_doc_path = DocumentPath.copy_from(
            src_doc_path,
            version=doc_path.version + 1
        )
        self.make_sure_path_exists(
            self.abspath(dst_doc_path)
        )

        # replace stapler!
        # stapler.reorder_pages(
        #    src=self.abspath(src_doc_path),
        #    dst=self.abspath(dst_doc_path),
        #    new_order=new_order
        # )

        page_count = self.get_pagecount(doc_path)

        if len(new_order) > page_count:
            logger.error(
                f"deleted_pages({new_order}) > page_count({page_count})"
            )
            return

        # steps were removed
        # for item in new_order:
        #    for step in Steps():
        #        src_page_path = PagePath(
        #            document_path=src_doc_path,
        #            page_num=int(item['page_num']),
        #            step=step,
        #            page_count=len(new_order)
        #        )
        #        dst_page_path = PagePath(
        #            document_path=dst_doc_path,
        #            page_num=int(item['page_order']),
        #            step=step,
        #            page_count=len(new_order)
        #        )
        #        self.copy_page(
        #            src_page_path=src_page_path,
        #            dst_page_path=dst_page_path
        #        )

        return doc_path.version + 1

    def delete_pages(
        self,
        doc_path,
        page_numbers,
        skip_migration=False
    ):
        """
        Delets pages in the document pointed by doc_path.
        doc_path is an instance of mglib.path.DocumentPath

        In case of success returns document's new version.
        """

        if not isinstance(page_numbers, list):
            logger.error("Expecting list argument")
            return False

        src_doc_path = doc_path
        dst_doc_path = DocumentPath.copy_from(
            src_doc_path,
            version=doc_path.version + 1
        )
        self.make_sure_path_exists(
            self.abspath(dst_doc_path)
        )

        if skip_migration:
            return doc_path.version + 1

        page_count = self.get_pagecount(doc_path)

        if len(page_numbers) > page_count:
            logger.error(
                f"deleted_pages({page_numbers}) > page_count({page_count})"
            )
            return

        return doc_path.version + 1

    def paste_pages(
        self,
        dest_doc_path,
        data_list,
        dest_doc_is_new=False,
        after_page_number=False,
        before_page_number=False
    ):
        """
        Pastes pages in the document pointed by dest_doc_path
        from src_doc_path. Both dest and src are instances of
        mglib.path.DocumentPath
        """
        next_version = 0
        if dest_doc_is_new:
            # document is new, start version with 0
            next_version = 0
        else:
            # destination document is not new, increment its version
            next_version = dest_doc_path.version + 1

        next_ver_dp = DocumentPath.copy_from(
            dest_doc_path,
            version=next_version
        )
        self.make_sure_path_exists(
            self.abspath(next_ver_dp)
        )

        # stapler.paste_pages(
        #    src=self.abspath(dest_doc_path),
        #    dst=self.abspath(next_ver_dp),
        #    data_list=data_list,
        #    dst_doc_is_new=dest_doc_is_new,
        #    after_page_number=after_page_number,
        #    before_page_number=before_page_number
        # )

        if not dest_doc_is_new:
            # migrate document's own pages from previous
            # version (this differs from pasting into newly
            # created docs)
            pcount = self.get_pagecount(dest_doc_path)
            data_list.insert(
                0,
                {
                    'doc_path': dest_doc_path,
                    'page_nums': list(range(1, pcount + 1))
                }
            )

        # dest_page_num = 1
        # dest_page_count = sum([
        #    len(item['page_nums']) for item in data_list
        # ])
        # for item in data_list:
        #    src_path = item['doc_path']
        #    for page_num in item['page_nums']:
        #        for step in Steps():
        #            src_page_path = PagePath(
        #                document_path=src_path,
        #                page_num=int(page_num),
        #                step=step,
        #                page_count=self.get_pagecount(src_path)
        #            )
        #            dst_page_path = PagePath(
        #                document_path=next_ver_dp,
        #                page_num=dest_page_num,
        #                step=step,
        #                page_count=dest_page_count
        #            )
        #            logger.debug(f"src={src_page_path}  dst={dst_page_path}")
        #            self.copy_page(
        #                src_page_path=src_page_path,
        #                dst_page_path=dst_page_path
        #            )
        #        dest_page_num += 1

        return next_version


class FileSystemStorage(Storage):
    pass


def copy_file(src: Path | io.BytesIO, dst: Path):
    """Copy source file to destination"""
    logger.debug(f"copying {src} to {dst}")

    if not dst.parent.exists():
        os.makedirs(dst.parent, exist_ok=True)

    if isinstance(src, Path):
        logger.debug(f"{src} is a Path instance")
        shutil.copyfile(src, dst)
    elif isinstance(src, io.BytesIO):
        with open(dst, 'wb') as f:
            f.write(src.getvalue())
    else:
        raise ValueError(
            f"src ({src}) is neither instance of DocumentPath nor io.Bytes"
        )
