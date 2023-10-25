import uuid
from unittest.mock import patch

import pytest

from papermerge.core.models import Document
from papermerge.core.page_operations import move_pages
from papermerge.core.pathlib import abs_page_path
from papermerge.core.schemas.pages import MoveStrategy
from papermerge.test import maker
from papermerge.test.baker_recipes import user_recipe


@pytest.mark.django_db
@patch('papermerge.core.signals.ocr_document_task')
@patch('papermerge.core.signals.generate_page_previews_task')
def test_move_pages_one_single_page_strategy_mix(_, __):
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


@pytest.mark.django_db
@patch('papermerge.core.signals.ocr_document_task')
@patch('papermerge.core.signals.generate_page_previews_task')
def test_move_pages_two_pages_strategy_mix(_, __):
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


@pytest.mark.django_db
@patch('papermerge.core.signals.ocr_document_task')
@patch('papermerge.core.signals.generate_page_previews_task')
def test_move_pages_one_single_page_strategy_replace(_, __):
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


@pytest.mark.django_db
@patch('papermerge.core.signals.ocr_document_task')
@patch('papermerge.core.signals.generate_page_previews_task')
def test_move_all_pages_of_the_doc_out_mix(_, __):
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


@pytest.mark.django_db
@patch('papermerge.core.signals.ocr_document_task')
@patch('papermerge.core.signals.generate_page_previews_task')
def test_move_all_pages_of_the_doc_out_replace_strategy(_, __):
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
