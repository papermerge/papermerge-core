import pikepdf
import io
import os
from pathlib import Path

from sqlalchemy import select, func

from core.features.conftest import make_document_from_resource
from papermerge.core import orm, schema
from papermerge.core.tests.resource_file import ResourceFile
from papermerge.core import constants
from papermerge.core.features.page_mngm.db import api as page_mngm_dbapi
from papermerge.core.features.document.db import api as doc_dbapi

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

    doc_ver = doc_dbapi.get_doc_ver(
        db_session, document_version_id=doc_ver_y.id, user_id=user.id
    )

    assert doc_ver.pages[0].text == "body"


def test_apply_pages_op(three_pages_pdf: schema.Document, db_session):
    doc = db_session.execute(
        select(orm.Document).where(orm.Document.id == three_pages_pdf.id)
    ).scalar()
    user = doc.user

    orinal_pages = doc_dbapi.get_last_ver_pages(
        db_session, document_id=doc.id, user_id=user.id
    )
    orinal_pages[0].text = "cat"
    orinal_pages[1].text = "doc"

    page = schema.MovePage(id=orinal_pages[0].id, number=orinal_pages[0].number)
    items = [schema.PageAndRotOp(page=page, angle=0)]

    page_mngm_dbapi.apply_pages_op(db_session, items, user_id=user.id)

    new_version_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == doc.id
        )
    ).scalar()

    newly_created_last_ver = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=doc.id, user_id=user.id
    )
    newly_created_pages = doc_dbapi.get_doc_ver_pages(
        db_session, doc_ver_id=newly_created_last_ver.id
    )

    # now document has two version
    assert new_version_count == 2
    # newly created version has only one page
    assert len(newly_created_last_ver.pages) == 1
    # and last page (and the only page) of the newly
    # created document has word "cat"
    assert newly_created_pages[0].text == "cat"
    # and it different page from the original one
    assert newly_created_pages[0].id != orinal_pages[0].id


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


def test_extract_all_pages_to_folder_each_page_in_separate_doc(
    make_document_from_resource, make_folder, user, db_session
):
    """Scenario tests extraction of ALL pages of source document
    into destination folder. Each page is extracted into
    a separate document.
    """
    src = make_document_from_resource(
        resource=ResourceFile.THREE_PAGES, user=user, parent=user.home_folder
    )
    dst_folder = make_folder(title="Target folder", user=user, parent=user.home_folder)
    old_doc_count = db_session.execute(
        select(func.count(orm.Document.id)).where(orm.Document.id == src.id)
    ).scalar()
    assert old_doc_count == 1

    src_ver = src.versions[0]
    src_all_pages = db_session.execute(
        select(orm.Page)
        .where(orm.Page.document_version_id == src_ver.id)
        .order_by(orm.Page.number)
    ).scalars()
    saved_src_pages_ids = [p.id for p in src_all_pages.all()]

    # add some text to the source version pages
    for p in src_all_pages.all():
        db_session.add(p)
        p.text = f"I am page number {p.number}!"

    db_session.commit()

    # page extraction / function under test (FUD)
    [result_old_doc, result_new_docs] = page_mngm_dbapi.extract_pages(  # FUD
        db_session,
        user_id=user.id,
        # we are moving out ALL pages of the source doc version
        source_page_ids=saved_src_pages_ids,
        target_folder_id=dst_folder.id,
        strategy=schema.ExtractStrategy.ONE_PAGE_PER_DOC,
        title_format="my-new-doc",
    )

    assert result_old_doc is None  # all document must be deleted
    assert len(result_new_docs) == 3
    assert result_new_docs[0].parent_id == dst_folder.id
    assert result_new_docs[1].parent_id == dst_folder.id
    assert result_new_docs[2].parent_id == dst_folder.id

    old_doc_count = db_session.execute(
        select(func.count(orm.Document.id)).where(orm.Document.id == src.id)
    ).scalar()
    assert old_doc_count == 0


def test_move_pages_one_single_page_strategy_mix(
    make_document_from_resource, db_session, user
):
    """Scenario tests moving of one page from
    src to dst (strategy: mix). Scenario is illustrated
    in following table:

         src   -[S2]->   dst
    old -> new       old -> new
     S1    S1         D1    S2
     S2               D2    D1
                      D3    D2
                           D3
    """
    src = make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    dst = make_document_from_resource(
        resource=ResourceFile.D3_PDF, user=user, parent=user.home_folder
    )

    src_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)
    src_page = src_ver.pages[1]

    dst_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=dst.id, user_id=user.id)
    dst_page = dst_ver.pages[0]

    page_mngm_dbapi.move_pages(
        db_session,
        # we are moving out second page of the source document version
        source_page_ids=[src_page.id],
        target_page_id=dst_page.id,
        move_strategy=schema.MoveStrategy.MIX,
        user_id=user.id,
    )

    src_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == src.id
        )
    ).scalar()
    # src now have one more version
    # versions were incremented +1
    assert src_versions_count == 2

    src_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=src.id, user_id=user.id
    )
    # src's last version's count of pages has one page less
    assert len(src_last_version.pages) == 1  # previously was 2

    dst_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == dst.id
        )
    ).scalar()
    # dst now have one more version
    # versions were incremented +1 from
    assert dst_versions_count == 2

    dst_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=dst.id, user_id=user.id
    )
    # dst's last version's count of pages has one page more
    assert len(dst_last_version.pages) == 4  # previously was 3

    with pikepdf.Pdf.open(dst_last_version.file_path) as my_pdf:
        assert len(my_pdf.pages) == 4


def test_move_pages_two_pages_strategy_mix(
    make_document_from_resource, db_session, user
):
    """Scenario tests moving of two pages from
    src to dst (strategy: mix). Scenario is illustrated
    in following table:

                Strategy: MIX
         src   --[S1, S3]-->  dst
    old -> new          old -> new
     S1    S2            D1    S1
     S2                  D2    S3
     S3                  D3    D1
                               D2
                               D3
    """
    src = make_document_from_resource(
        resource=ResourceFile.S3_PDF, user=user, parent=user.home_folder
    )
    dst = make_document_from_resource(
        resource=ResourceFile.D3_PDF, user=user, parent=user.home_folder
    )
    src_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)
    src_page_1 = src_ver.pages[0]
    src_page_3 = src_ver.pages[2]

    dst_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=dst.id, user_id=user.id)
    dst_page = dst_ver.pages[0]

    page_mngm_dbapi.move_pages(
        db_session,
        source_page_ids=[src_page_1.id, src_page_3.id],
        target_page_id=dst_page.id,
        move_strategy=schema.MoveStrategy.MIX,
        user_id=user.id,
    )

    src_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == src.id
        )
    ).scalar()

    src_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=src.id, user_id=user.id
    )
    dst_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == dst.id
        )
    ).scalar()
    dst_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=dst.id, user_id=user.id
    )

    # src, dst now have one more version
    # versions were incremented +1 from (1) and (2)
    assert src_versions_count == 2

    assert len(src_last_version.pages) == 1  # previously was 3
    with pikepdf.Pdf.open(src_last_version.file_path) as my_pdf:
        assert len(my_pdf.pages) == 1

    assert dst_versions_count == 2

    assert len(dst_last_version.pages) == 5  # previously was 3
    with pikepdf.Pdf.open(dst_last_version.file_path) as my_pdf:
        assert len(my_pdf.pages) == 5


def test_move_pages_one_single_page_strategy_replace(
    make_document_from_resource, db_session, user
):
    """Scenario tests moving of one page from
    src to dst (strategy: replace). Scenario is illustrated
    in following table:

         src   -[S2]->   dst
    old -> new       old -> new   # Replace strategy
     S1    S1         D1    S2
     S2               D2
                      D3
    """
    src = make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    dst = make_document_from_resource(
        resource=ResourceFile.D3_PDF, user=user, parent=user.home_folder
    )

    src_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)
    src_page = src_ver.pages[1]

    dst_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=dst.id, user_id=user.id)

    dst_page = dst_ver.pages[0]

    page_mngm_dbapi.move_pages(
        db_session,
        # we are moving out second page of the source document version
        source_page_ids=[src_page.id],
        target_page_id=dst_page.id,
        move_strategy=schema.MoveStrategy.REPLACE,
        user_id=user.id,
    )

    src_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == src.id
        )
    ).scalar()

    src_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=src.id, user_id=user.id
    )
    dst_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == dst.id
        )
    ).scalar()
    dst_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=dst.id, user_id=user.id
    )

    # src, dst now have one more version
    # versions were incremented +1 from (1) and (2)
    assert src_versions_count == 2
    # src's last version's count of pages has one page less
    assert len(src_last_version.pages) == 1  # previously was 2
    with pikepdf.Pdf.open(src_last_version.file_path) as my_pdf:
        assert len(my_pdf.pages) == 1

    assert dst_versions_count == 2
    # dst's last version's count of pages has one page more
    assert len(dst_last_version.pages) == 1  # previously was 3
    with pikepdf.Pdf.open(dst_last_version.file_path) as my_pdf:
        assert len(my_pdf.pages) == 1


def test_move_all_pages_of_the_doc_out_mix(
    make_document_from_resource, db_session, user
):
    """Scenario tests moving of ALL page of source document.
    In this case source document will be entirely deleted:

              Mix strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new
     S1    X          D1    S1
     S2               D2    S2
                      D3    D1
                            D2
                            D3

    after operation src document is deleted
    """
    src = make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    dst = make_document_from_resource(
        resource=ResourceFile.D3_PDF, user=user, parent=user.home_folder
    )

    src_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)
    saved_src_pages_ids = list(
        [page.id for page in sorted(src_ver.pages, key=lambda x: x.number)]
    )
    dst_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=dst.id, user_id=user.id)
    dst_page = dst_ver.pages[0]

    [result_old_doc, result_new_doc] = page_mngm_dbapi.move_pages(
        db_session,
        # we are moving out all pages of the source doc version
        source_page_ids=saved_src_pages_ids,
        target_page_id=dst_page.id,
        move_strategy=schema.MoveStrategy.MIX,
        user_id=user.id,
    )

    assert result_old_doc is None  # Old doc/Source was deleted
    assert result_new_doc.id == dst.id

    db_session.commit()

    # Source document was deleted

    newly_fetched_src = db_session.execute(
        select(orm.Document).where(orm.Document.id == src.id)
    ).one_or_none()

    dst_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == dst.id
        )
    ).scalar()
    dst_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=dst.id, user_id=user.id
    )

    assert newly_fetched_src is None

    # Destination document's version was inc + 1
    assert dst_versions_count == 2
    # dst's last version's count of pages has one page more
    assert len(dst_last_version.pages) == 5  # previously was 3


def test_move_all_pages_of_the_doc_out_replace_strategy(
    make_document_from_resource, db_session, user
):
    """Scenario tests moving of ALL page of source document.
    In this case source document will be entirely deleted:

              Replace strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new
     S1    X          D1    S1
     S2               D2    S2
                      D3

    after operation src document is deleted
    """
    src = make_document_from_resource(
        resource=ResourceFile.LIVING_THINGS, user=user, parent=user.home_folder
    )
    dst = make_document_from_resource(
        resource=ResourceFile.D3_PDF, user=user, parent=user.home_folder
    )

    src_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=src.id, user_id=user.id)
    saved_src_pages_ids = list(
        [page.id for page in sorted(src_ver.pages, key=lambda x: x.number)]
    )
    dst_ver = doc_dbapi.get_last_doc_ver(db_session, doc_id=dst.id, user_id=user.id)
    dst_page = dst_ver.pages[0]

    [result_old_doc, result_new_doc] = page_mngm_dbapi.move_pages(
        db_session,
        # we are moving out all pages of the source doc version
        source_page_ids=saved_src_pages_ids,
        target_page_id=dst_page.id,
        move_strategy=schema.MoveStrategy.REPLACE,
        user_id=user.id,
    )

    assert result_old_doc is None  # Old doc/Source was deleted
    assert result_new_doc.id == dst.id

    db_session.commit()

    # Source document was deleted

    newly_fetched_src = db_session.execute(
        select(orm.Document).where(orm.Document.id == src.id)
    ).one_or_none()

    dst_versions_count = db_session.execute(
        select(func.count(orm.DocumentVersion.id)).where(
            orm.DocumentVersion.document_id == dst.id
        )
    ).scalar()
    dst_last_version = doc_dbapi.get_last_doc_ver(
        db_session, doc_id=dst.id, user_id=user.id
    )

    assert newly_fetched_src is None

    # Destination document's version was inc + 1
    assert dst_versions_count == 2
    assert len(dst_last_version.pages) == 2


def test_get_docver_ids(db_session, make_document_version, user):
    doc_ver_x = make_document_version(
        page_count=2, pages_text=["some", "body"], user=user
    )
    doc_ver_y = make_document_version(page_count=1, user=user)
    doc_ids = [doc_ver_x.document_id, doc_ver_y.document_id]

    docver_ids = page_mngm_dbapi.get_docver_ids(db_session, document_ids=doc_ids)

    assert set(docver_ids) == {doc_ver_x.id, doc_ver_y.id}
