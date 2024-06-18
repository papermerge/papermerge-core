import uuid
from unittest.mock import patch

import pytest

from papermerge.core.models import Document
from papermerge.core.page_ops import (apply_pages_op, copy_text_field,
                                      copy_without_pages, extract_pages,
                                      move_pages)
from papermerge.core.pathlib import abs_page_path
from papermerge.core.schemas.pages import ExtractStrategy, MoveStrategy
from papermerge.core.schemas.pages import Page as PyPage
from papermerge.core.schemas.pages import PageAndRotOp
from papermerge.test import maker
from papermerge.test.baker_recipes import folder_recipe, user_recipe

pytestmark = pytest.mark.django_db


def test_copy_text_field():
    doc_ver_x = maker.document_version(
        page_count=2,
        pages_text=["some", "body"]
    )

    doc_ver_y = maker.document_version(
        page_count=1
    )

    # copy text field of doc ver X to doc ver Y
    copy_text_field(
        src=doc_ver_x,
        dst=doc_ver_y,
        page_numbers=[2]
    )

    assert doc_ver_y.pages.all()[0].text == "body"


@patch('papermerge.core.signals.send_ocr_task')
def test_apply_pages_op(_):
    """This test checks if `apply_pages_op` correctly copies
    page text data"""
    user = user_recipe.make()
    # 1. create a doc with two pages
    # first page has word "cat"
    # second page has word "dog"
    src = maker.document(
        resource='living-things.pdf',
        user=user,
        include_ocr_data=True
    )
    orig_first_page = src.versions.last().pages.all()[0]
    orig_second_page = src.versions.last().pages.all()[1]
    orig_first_page.text = "cat"
    orig_second_page.text = "dog"
    orig_first_page.save()
    orig_second_page.save()

    assert src.versions.last().pages.count() == 2

    page = src.versions.last().pages.first()
    pypage = PyPage(id=page.pk, number=page.number)
    items = [PageAndRotOp(page=pypage, angle=0)]

    # It should copy only first page which contains word "cat"
    versions = apply_pages_op(items)

    # now there one more version (originally was only one doc ver)
    assert versions.count() == 2
    newly_created_version = versions.last()

    # newly create version should have only one page
    assert newly_created_version.pages.count() == 1
    first_page = newly_created_version.pages.first()
    # and that page should have word "cat"
    assert first_page.text == "cat"
    assert first_page.id != orig_first_page.id


@patch('papermerge.core.signals.send_ocr_task')
def test_move_pages_one_single_page_strategy_mix(_):
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
    user = user_recipe.make()
    src = maker.document(
        resource='living-things.pdf',
        user=user,
        include_ocr_data=True
    )
    dst = maker.document(
        resource='d3.pdf',
        user=user,
        include_ocr_data=True
    )
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1   # (1)
    assert src.versions.last().pages.count() == 2
    assert dst.versions.count() == 1   # (2)
    assert dst.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    src_page = src_ver.pages.all()[1]

    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    move_pages(
        # we are moving out second page of the source document version
        source_page_ids=[str(src_page.id)],
        target_page_id=str(dst_page.id),
        move_strategy=MoveStrategy.MIX
    )

    src.refresh_from_db()
    dst.refresh_from_db()
    # src, dst now have one more version
    # versions were incremented +1 from (1) and (2)
    assert src.versions.count() == 2
    # src's last version's count of pages has one page less
    assert src.versions.last().pages.count() == 1  # previously was 2
    assert dst.versions.count() == 2
    # dst's last version's count of pages has one page more
    assert dst.versions.last().pages.count() == 4  # previously was 3

    src_old_pages = src.versions.first().pages.all()
    dst_old_pages = dst.versions.first().pages.all()
    dst_new_pages = dst.versions.last().pages.all()
    """
         src     -[S2]->  dst
    old -> new         old -> new    index
     S1    S1           D1    S2       0
     S2                 D2    D1       1
                        D3    D2       2
                              D3       3
    """
    assert PageDir(
        dst_new_pages[0].id, number=1, name="dst new"
    ) == PageDir(
        src_old_pages[1].id, number=2, name="src old"
    )

    assert PageDir(
        dst_new_pages[1].id, number=2, name="dst new"
    ) == PageDir(
        dst_old_pages[0].id, number=1, name="dst old"
    )

    assert PageDir(
        dst_new_pages[2].id, number=3, name="dst new"
    ) == PageDir(dst_old_pages[1].id, number=2, name="dst old")

    assert PageDir(
        dst_new_pages[3].id, number=4, name="dst new"
    ) == PageDir(
        dst_old_pages[2].id, number=3, name="dst old"
    )


@patch('papermerge.core.signals.send_ocr_task')
def test_move_pages_two_pages_strategy_mix(_):
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
    user = user_recipe.make()
    src = maker.document(
        resource='s3.pdf',
        user=user,
        include_ocr_data=True
    )
    dst = maker.document(
        resource='d3.pdf',
        user=user,
        include_ocr_data=True
    )
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1   # (1)
    assert src.versions.last().pages.count() == 3
    assert dst.versions.count() == 1   # (2)
    assert dst.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    src_page_1 = src_ver.pages.all()[0]
    src_page_3 = src_ver.pages.all()[2]

    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    move_pages(
        source_page_ids=[str(src_page_1.id), str(src_page_3.id)],
        target_page_id=str(dst_page.id),
        move_strategy=MoveStrategy.MIX
    )

    src.refresh_from_db()
    dst.refresh_from_db()
    # src, dst now have one more version
    # versions were incremented +1 from (1) and (2)
    assert src.versions.count() == 2
    assert src.versions.last().pages.count() == 1  # previously was 3
    assert dst.versions.count() == 2
    assert dst.versions.last().pages.count() == 5  # previously was 3

    src_old_pages = src.versions.first().pages.all()
    dst_old_pages = dst.versions.first().pages.all()
    dst_new_pages = dst.versions.last().pages.all()
    """
                Strategy: MIX
         src   --[S1, S3]-->  dst
    old -> new          old -> new
     S1    S2            D1    S1
     S2                  D2    S3
     S3                  D3    D1
                               D2
                               D3
    """
    assert PageDir(
        dst_new_pages[0].id, number=1, name="dst new"
    ) == PageDir(
        src_old_pages[0].id, number=1, name="src old"
    )

    assert PageDir(
        dst_new_pages[1].id, number=2, name="dst new"
    ) == PageDir(
        src_old_pages[2].id, number=3, name="src old"
    )

    assert PageDir(
        dst_new_pages[2].id, number=3, name="dst new"
    ) == PageDir(dst_old_pages[0].id, number=1, name="dst old")

    assert PageDir(
        dst_new_pages[3].id, number=4, name="dst new"
    ) == PageDir(dst_old_pages[1].id, number=2, name="dst old")

    assert PageDir(
        dst_new_pages[4].id, number=5, name="dst new"
    ) == PageDir(dst_old_pages[2].id, number=3, name="dst old")


@patch('papermerge.core.signals.send_ocr_task')
def test_move_pages_one_single_page_strategy_replace(_):
    """Scenario tests moving of one page from
    src to dst (strategy: replace). Scenario is illustrated
    in following table:

         src   -[S2]->   dst
    old -> new       old -> new   # Replace strategy
     S1    S1         D1    S2
     S2               D2
                      D3
    """
    user = user_recipe.make()
    src = maker.document(
        resource='living-things.pdf',
        user=user,
        include_ocr_data=True
    )
    dst = maker.document(
        resource='d3.pdf',
        user=user,
        include_ocr_data=True
    )
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1   # (1)
    assert src.versions.last().pages.count() == 2
    assert dst.versions.count() == 1   # (2)
    assert dst.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    src_page = src_ver.pages.all()[1]

    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    move_pages(
        # we are moving out second page of the source document version
        source_page_ids=[str(src_page.id)],
        target_page_id=str(dst_page.id),
        move_strategy=MoveStrategy.REPLACE
    )

    src.refresh_from_db()
    dst.refresh_from_db()
    # src, dst now have one more version
    # versions were incremented +1 from (1) and (2)
    assert src.versions.count() == 2
    # src's last version's count of pages has one page less
    assert src.versions.last().pages.count() == 1  # previously was 2
    assert dst.versions.count() == 2
    # dst's last version's count of pages has one page more
    assert dst.versions.last().pages.count() == 1  # previously was 3

    src_old_pages = src.versions.first().pages.all()
    dst_new_pages = dst.versions.last().pages.all()
    """
         src     -[S2]->  dst    (Replace strategy)
    old -> new         old -> new    index
     S1    S1           D1    S2       0
     S2                 D2             1
                        D3             2
    """
    assert PageDir(
        dst_new_pages[0].id, number=1, name="dst new"
    ) == PageDir(
        src_old_pages[1].id, number=2, name="src old"
    )


@patch('papermerge.core.signals.send_ocr_task')
def test_move_all_pages_of_the_doc_out_mix(_):
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
    user = user_recipe.make()
    src = maker.document(
        resource='living-things.pdf',
        user=user,
        include_ocr_data=True
    )
    dst = maker.document(
        resource='d3.pdf',
        user=user,
        include_ocr_data=True
    )
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1   # (1)
    assert src.versions.last().pages.count() == 2
    assert dst.versions.count() == 1   # (2)
    assert dst.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    saved_src_pages_ids = list(
        [page.id for page in src_ver.pages.order_by('number')]
    )
    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    [result_old_doc, result_new_doc] = move_pages(
        # we are moving out all pages of the source doc version
        source_page_ids=[str(page.id) for page in src_ver.pages.all()],
        target_page_id=str(dst_page.id),
        move_strategy=MoveStrategy.MIX
    )

    dst.refresh_from_db()
    assert result_old_doc is None  # Old doc/Source was deleted
    assert result_new_doc.id == dst.id

    # Source document was deleted
    assert Document.objects.filter(pk=src.id).count() == 0
    # Destination document's version was inc + 1
    assert dst.versions.count() == 2
    # dst's last version's count of pages has one page more
    assert dst.versions.last().pages.count() == 5  # previously was 3

    dst_new_pages = dst.versions.last().pages.all()
    dst_old_pages = dst.versions.first().pages.all()
    """
              Mix strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new     index
     S1    X          D1    S1        0
     S2               D2    S2        1
                      D3    D1        2
                            D2        3
                            D3        4

    after operation src document is deleted
    """
    assert PageDir(
        dst_new_pages[0].id, number=1, name="dst new"
    ) == PageDir(
        saved_src_pages_ids[0], number=1, name="src old"
    )
    assert PageDir(
        dst_new_pages[1].id, number=2, name="dst new"
    ) == PageDir(
        saved_src_pages_ids[1], number=2, name="src old"
    )
    assert PageDir(
        dst_new_pages[2].id, number=3, name="dst new"
    ) == PageDir(
        dst_old_pages[0].id, number=1, name="dst old"
    )
    assert PageDir(
        dst_new_pages[3].id, number=4, name="dst new"
    ) == PageDir(
        dst_old_pages[1].id, number=2, name="dst old"
    )
    assert PageDir(
        dst_new_pages[4].id, number=5, name="dst new"
    ) == PageDir(
        dst_old_pages[2].id, number=3, name="dst old"
    )


@patch('papermerge.core.signals.send_ocr_task')
def test_move_all_pages_of_the_doc_out_replace_strategy(_):
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
    user = user_recipe.make()
    src = maker.document(
        resource='living-things.pdf',
        user=user,
        include_ocr_data=True
    )
    dst = maker.document(
        resource='d3.pdf',
        user=user,
        include_ocr_data=True
    )
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1   # (1)
    assert src.versions.last().pages.count() == 2
    assert dst.versions.count() == 1   # (2)
    assert dst.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    saved_src_pages_ids = list(
        [page.id for page in src_ver.pages.order_by('number')]
    )
    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    [result_old_doc, result_new_doc] = move_pages(
        # we are moving out all pages of the source doc version
        source_page_ids=[str(page.id) for page in src_ver.pages.all()],
        target_page_id=str(dst_page.id),
        move_strategy=MoveStrategy.REPLACE
    )

    dst.refresh_from_db()
    assert result_old_doc is None  # Old doc/Source was deleted
    assert result_new_doc.id == dst.id

    # Source document was deleted
    assert Document.objects.filter(pk=src.id).count() == 0
    # Destination document's version was inc + 1
    assert dst.versions.count() == 2
    assert dst.versions.last().pages.count() == 2

    dst_new_pages = dst.versions.last().pages.all()
    """
              Replace strategy
         src   -[S1, S2]->   dst
    old -> new       old -> new
     S1    X          D1    S1
     S2               D2    S2
                      D3

    after operation src document is deleted
    """
    assert PageDir(
        dst_new_pages[0].id, number=1, name="dst new"
    ) == PageDir(
        saved_src_pages_ids[0], number=1, name="src old"
    )
    assert PageDir(
        dst_new_pages[1].id, number=2, name="dst new"
    ) == PageDir(
        saved_src_pages_ids[1], number=2, name="src old"
    )


@patch('papermerge.core.signals.send_ocr_task')
def test_extract_two_pages_to_folder_all_pages_in_one_doc(_):
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
    user = user_recipe.make()
    src = maker.document(
        resource='s3.pdf',
        user=user,
        include_ocr_data=True
    )
    dst_folder = folder_recipe.make(user=user, parent=user.home_folder)
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1   # (1)
    assert src.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    saved_src_pages_ids = list([
        page.id
        for page in src_ver.pages.order_by('number')
        if page.number <= 2
    ])

    [result_old_doc, result_new_docs] = extract_pages(
        # we are moving out all pages of the source doc version
        source_page_ids=[
            page.id for page in src_ver.pages.all()
            if page.number <= 2
        ],
        target_folder_id=dst_folder.id,
        strategy=ExtractStrategy.ALL_PAGES_IN_ONE_DOC,
        title_format="my-new-doc"
    )

    assert result_old_doc
    assert result_old_doc.versions.count() == 2
    assert len(result_new_docs) == 1  # only one document was created
    # newly created document is in dst_folder
    assert result_new_docs[0].parent == dst_folder
    dst_pages = result_new_docs[0].versions.last().pages.all()

    assert PageDir(
        dst_pages[0].id, number=1, name="dst newly created doc"
    ) == PageDir(
        saved_src_pages_ids[0], number=1, name="src old"
    )
    assert PageDir(
        dst_pages[1].id, number=2, name="dst newly create doc"
    ) == PageDir(
        saved_src_pages_ids[1], number=2, name="src old"
    )


@patch('papermerge.core.signals.send_ocr_task')
def test_extract_two_pages_to_folder_each_page_in_separate_doc(_):
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
    user = user_recipe.make()
    src = maker.document(
        resource='s3.pdf',
        user=user,
        include_ocr_data=True
    )
    dst_folder = folder_recipe.make(user=user, parent=user.home_folder)
    # Initial visual checks:
    # count of document versions and number of pages in the doc
    assert src.versions.count() == 1   # (1)
    assert src.versions.last().pages.count() == 3

    src_ver = src.versions.last()
    saved_src_pages_ids = list([
        page.id
        for page in src_ver.pages.order_by('number')
        if page.number <= 2
    ])

    # add some text to the source version pages
    for p in src_ver.pages.all():
        p.text = f"I am page number {p.number}!"
        p.save()

    # page extraction / function under test (FUD)
    [result_old_doc, result_new_docs] = extract_pages(  # FUD
        # we are moving out first two pages of the source doc version
        source_page_ids=[
            page.id for page in src_ver.pages.all() if page.number <= 2
        ],
        target_folder_id=dst_folder.id,
        strategy=ExtractStrategy.ONE_PAGE_PER_DOC,
        title_format="my-new-doc"
    )

    assert result_old_doc
    assert result_old_doc.versions.count() == 2
    assert len(result_new_docs) == 2  # two document were created
    # newly created docs are in dst_folder
    assert result_new_docs[0].parent == dst_folder
    assert result_new_docs[1].parent == dst_folder

    dst_pages1 = result_new_docs[0].versions.last().pages.all()
    dst_pages2 = result_new_docs[1].versions.last().pages.all()

    assert PageDir(
        dst_pages1[0].id, number=1, name="dst1 newly created doc"
    ) == PageDir(
        saved_src_pages_ids[0], number=1, name="src old"
    )
    # destination page must be same as first source page
    assert dst_pages1[0].text == src_ver.pages.all()[0].text

    assert PageDir(
        dst_pages2[0].id, number=1, name="dst2 newly create doc"
    ) == PageDir(
        saved_src_pages_ids[1], number=2, name="src old"
    )
    # destination page must be same as second source page
    assert dst_pages2[0].text == src_ver.pages.all()[1].text


@patch('papermerge.core.signals.send_ocr_task')
def test_copy_without_pages(_):
    """Scenario

         copy without page 1
    ver X  ->  ver X + 1
     S1         S2
     S2
    """
    user = user_recipe.make()
    # 1. create a doc with two pages
    # first page has word "cat"
    # second page has word "dog"
    src = maker.document(
        resource='living-things.pdf',
        user=user,
        include_ocr_data=True
    )
    orig_doc_ver = src.versions.last()
    orig_first_page = orig_doc_ver.pages.all()[0]
    orig_second_page = orig_doc_ver.pages.all()[1]
    orig_first_page.text = "cat"
    orig_second_page.text = "dog"
    orig_first_page.save()
    orig_second_page.save()
    # page containing "cat" / first page is left behind
    pages_to_leave_behind = [orig_doc_ver.pages.first().id]

    [_, new_ver, _] = copy_without_pages(pages_to_leave_behind)

    assert new_ver.pages.count() == 1
    # new version contains only 'dog'
    assert ['dog'] == [p.text for p in new_ver.pages.all()]
    assert new_ver.text == 'dog'


class PageDir:
    """Helper class to test if content of two dirs is same

    In order for two dirs to have same content they need to
    have same files and each corresponding file must have same content.

    The whole point is to test if page content dir was copied
    correctly
    """
    def __init__(
        self,
        page_id: uuid.UUID,
        number: int,
        name: str
    ):
        """Only page_id is used for comparison, other fields
        (number, name) are only for easy human reading when
        assert comparison fails"""
        self.page_id = str(page_id)
        self.number = number  # helper for easy human read
        self.name = name  # helper for easy human read

    @property
    def files(self):
        path = abs_page_path(self.page_id)
        return sorted(path.glob('*'), key=lambda i: i.name)

    def __eq__(self, other):
        all_equal = True

        for file1, file2 in zip(self.files, other.files):
            content1 = open(file1).read()
            content2 = open(file2).read()
            if content1 != content2:
                all_equal = False

        return all_equal

    def __repr__(self):
        return f"PageDir("\
            f"number={self.number}, name={self.name} id={self.page_id}"\
            ")"
