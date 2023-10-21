from unittest.mock import patch

import pytest

from papermerge.core.page_operations import move_pages
from papermerge.core.schemas.pages import InsertAt, MoveStrategy
from papermerge.test import maker
from papermerge.test.baker_recipes import user_recipe


@pytest.mark.django_db
@patch('papermerge.core.signals.ocr_document_task')
@patch('papermerge.core.signals.generate_page_previews_task')
def test_move_pages(_, __):
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
    src_ver = src.versions.last()
    src_page = src_ver.pages.all()[1]

    dst_ver = dst.versions.last()
    dst_page = dst_ver.pages.all()[0]

    move_pages(
        source_page_ids=[str(src_page.id)],
        target_page_id=str(dst_page.id),
        insert_at=InsertAt.BEGINNING,
        move_strategy=MoveStrategy.APPEND
    )
