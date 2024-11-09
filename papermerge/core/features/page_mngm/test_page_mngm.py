import io
import os
from pathlib import Path

from papermerge.core import orm
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
