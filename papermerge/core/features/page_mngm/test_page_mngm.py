import uuid
import io
import os
from pathlib import Path

from sqlalchemy import select

from papermerge.core import orm, schema
from papermerge.core import constants
from papermerge.core.features.page_mngm.db import api as page_mngm_dbapi
from papermerge.core.features.document.db import api as doc_dbapi
from papermerge.core.pathlib import abs_page_path

DIR_ABS_PATH = os.path.abspath(Path(__file__).parent.parent)
RESOURCES = Path(DIR_ABS_PATH) / "document" / "tests" / "resources"


def test_copy_text_field(db_session, make_document_version, user):
    doc_ver_x = make_document_version(
        page_count=2, pages_text=["some", "body"], user=user
    )
    doc_ver_y = make_document_version(page_count=1, user=user)

    page_mngm_dbapi.copy_text_field(
        db_session, src=doc_ver_x, dst=doc_ver_y, page_numbers=[2]
    )

    doc_ver = doc_dbapi.get_doc_ver(db_session, id=doc_ver_y.id, user_id=user.id)

    assert doc_ver.pages[0].text == "body"


def test_apply_pages_op(): ...


def test_copy_without_pages(user, make_document, db_session):
    """Scenario

         copy without page 1

    ver X  ->  ver X + 1
     S1         S2
     S2         S3
     S3
    """

    ########## Arrange  ######

    # create a doc with three pages:
    #  * first page has word "cat"
    #  * second page has word "dog"
    #  * 3rd page has word "hamster"
    src = make_document(title="thee-pages.pdf", user=user, parent=user.home_folder)

    PDF_PATH = RESOURCES / "three-pages.pdf"

    with open(PDF_PATH, "rb") as file:
        content = file.read()
        size = os.stat(PDF_PATH).st_size
        update_src, _ = doc_dbapi.upload(
            db_session=db_session,
            document_id=src.id,
            content=io.BytesIO(content),
            file_name="three-pages.pdf",
            size=size,
            content_type=constants.ContentType.APPLICATION_PDF,
        )

    orig_doc_ver = update_src.versions[0]
    orig_pages = (
        db_session.query(orm.Page)
        .where(orm.Page.document_version_id == orig_doc_ver.id)
        .order_by(orm.Page.number)
    )

    orig_pages[0].text = "cat"
    orig_pages[1].text = "dog"
    orig_pages[2].text = "hamster"
    db_session.commit()

    # page containing "cat" / first page is left behind
    # other way to say it: user extract pages 2 and 3 i.e. page "dog" and "hamster"
    pages_to_leave_behind = [orig_pages[0].id]

    #### Act  ######
    [_, new_ver, _] = page_mngm_dbapi.copy_without_pages(
        db_session, pages_to_leave_behind, user_id=user.id
    )

    #### Assert #####
    assert len(new_ver.pages) == 2
    # new version contains only 'dog' and 'hamser'
    new_ver_fresh_pages_text = (
        db_session.query(orm.Page.text)
        .where(orm.Page.document_version_id == new_ver.id)
        .all()
    )
    assert {"dog", "hamster"} == set(i[0] for i in new_ver_fresh_pages_text)

    new_ver_fresh = (
        db_session.query(orm.DocumentVersion)
        .where(orm.DocumentVersion.id == new_ver.id)
        .scalar()
    )

    assert new_ver_fresh.text == "dog hamster"


def test_extract_two_pages_to_folder_all_pages_in_one_doc(
    make_document, make_folder, user, db_session
):
    """Scenario tests extraction of first two pages from
    source document into destination folder.
    Both pages are extracted into one single destination document.

        All pages in one doc
         src   -[S1, S2]->   dst
    old -> new       old -> new
     S1    S3         x     S1
     S2               x     S2
     S3
    """
    src = make_document(title="thee-pages.pdf", user=user, parent=user.home_folder)
    dst_folder = make_folder(title="Target folder", user=user, parent=user.home_folder)
    PDF_PATH = RESOURCES / "three-pages.pdf"

    with open(PDF_PATH, "rb") as file:
        content = file.read()
        size = os.stat(PDF_PATH).st_size
        update_src, _ = doc_dbapi.upload(
            db_session=db_session,
            document_id=src.id,
            content=io.BytesIO(content),
            file_name="three-pages.pdf",
            size=size,
            content_type=constants.ContentType.APPLICATION_PDF,
        )

    src_ver = src.versions[0]
    saved_src_pages_ids = db_session.execute(
        select(orm.Page.id)
        .where(orm.Page.document_version_id == src_ver.id, orm.Page.number <= 2)
        .order_by(orm.Page.number)
    ).scalars()
    saved_src_pages_ids = saved_src_pages_ids.all()

    [result_old_doc, result_new_docs] = page_mngm_dbapi.extract_pages(
        db_session,
        user_id=user.id,
        # we are moving out all pages of the source doc version
        source_page_ids=saved_src_pages_ids,
        target_folder_id=dst_folder.id,
        strategy=schema.ExtractStrategy.ALL_PAGES_IN_ONE_DOC,
        title_format="my-new-doc",
    )

    assert result_old_doc
    assert len(result_old_doc.versions) == 2
    assert len(result_new_docs) == 1
    assert result_new_docs[0].parent_id == dst_folder.id

    ver = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=result_new_docs[0].id, user_id=user.id
    )

    stmt = (
        select(orm.Page)
        .join(orm.DocumentVersion)
        .join(orm.Document)
        .where(orm.DocumentVersion.id == ver.id)
        .order_by(orm.Page.number)
    )

    pages = db_session.execute(stmt).scalars().all()

    p1 = PageDir(pages[0].id, number=1, name="dst newly created doc")
    p2 = PageDir(saved_src_pages_ids[0], number=1, name="src old")
    assert p1 == p2

    p1 = PageDir(pages[1].id, number=2, name="dst newly create doc")
    p2 = PageDir(saved_src_pages_ids[1], number=2, name="src old")
    assert p1 == p2


def test_extract_two_pages_to_folder_each_page_in_separate_doc(
    make_document, make_folder, user, db_session
):
    """Scenario tests extraction of first two pages of source document
    into destination folder. Each page is extracted into
    a separate document, as result to new documents are created.

        Each page into one separate doc
         src   -[S1, S2]->   dst1  ,   dst2
    old -> new       old -> new   old -> new
     S1    S3         x     S1     x     S2
     S2
     S3
    """
    src = make_document(title="thee-pages.pdf", user=user, parent=user.home_folder)
    dst_folder = make_folder(title="Target folder", user=user, parent=user.home_folder)
    PDF_PATH = RESOURCES / "three-pages.pdf"

    with open(PDF_PATH, "rb") as file:
        content = file.read()
        size = os.stat(PDF_PATH).st_size
        update_src, _ = doc_dbapi.upload(
            db_session=db_session,
            document_id=src.id,
            content=io.BytesIO(content),
            file_name="three-pages.pdf",
            size=size,
            content_type=constants.ContentType.APPLICATION_PDF,
        )

    src_ver = src.versions[0]
    src_pages = db_session.execute(
        select(orm.Page)
        .where(orm.Page.document_version_id == src_ver.id, orm.Page.number <= 2)
        .order_by(orm.Page.number)
    ).scalars()
    saved_src_pages_ids = [p.id for p in src_pages.all()]

    # add some text to the source version pages
    for p in src_pages.all():
        db_session.add(p)
        p.text = f"I am page number {p.number}!"

    db_session.commit()

    # page extraction / function under test (FUD)
    [result_old_doc, result_new_docs] = page_mngm_dbapi.extract_pages(  # FUD
        db_session,
        user_id=user.id,
        # we are moving out first two pages of the source doc version
        source_page_ids=saved_src_pages_ids,
        target_folder_id=dst_folder.id,
        strategy=schema.ExtractStrategy.ONE_PAGE_PER_DOC,
        title_format="my-new-doc",
    )

    assert result_old_doc
    assert len(result_old_doc.versions) == 2
    assert len(result_new_docs) == 2
    assert result_new_docs[0].parent_id == dst_folder.id
    assert result_new_docs[1].parent_id == dst_folder.id


class PageDir:
    """Helper class to test if content of two dirs is same

    In order for two dirs to have same content they need to
    have same files and each corresponding file must have same content.

    The whole point is to test if page content dir was copied
    correctly
    """

    def __init__(self, page_id: uuid.UUID, number: int, name: str):
        """Only page_id is used for comparison, other fields
        (number, name) are only for easy human reading when
        assert comparison fails"""
        self.page_id = str(page_id)
        self.number = number  # helper for easy human read
        self.name = name  # helper for easy human read

    @property
    def files(self):
        path = abs_page_path(self.page_id)
        return sorted(path.glob("*"), key=lambda i: i.name)

    def __eq__(self, other):
        all_equal = True

        for file1, file2 in zip(self.files, other.files):
            content1 = open(file1).read()
            content2 = open(file2).read()
            if content1 != content2:
                all_equal = False

        return all_equal

    def __repr__(self):
        path = abs_page_path(self.page_id)
        return f"PageDir(number={self.number}, path={path})"
