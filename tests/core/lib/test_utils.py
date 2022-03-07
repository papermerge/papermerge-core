import unittest

from papermerge.core.lib.utils import (
    get_reordered_list,
    get_assigns_after_delete
)


class TestCoreLibUtils(unittest.TestCase):

    def test_get_reordered_list_1(self):
        """
        In this scenario pages 1 and 3 were swapped i.e.
        page number 1 become number 3 and
        page number 3 become number 1
        """
        pages_data = [
            {'id': 1, 'old_number': 1, 'new_number': 3},
            {'id': 2, 'old_number': 2, 'new_number': 2},
            {'id': 3, 'old_number': 3, 'new_number': 1}
        ]
        reordered_list = get_reordered_list(
            pages_data=pages_data,
            page_count=3
        )

        assert reordered_list == [3, 2, 1]

    def test_get_reordered_list_2(self):
        """
        In this scenario pages 1 and 3 were swapped and
        only information (page_data) about page 1 and 3
        was supplied
        """
        # Notice that data for pages which were not reordered,
        # (in this case page number 2) was not provided
        pages_data = [
            {'id': 1, 'old_number': 1, 'new_number': 3},
            {'id': 3, 'old_number': 3, 'new_number': 1}
        ]
        reordered_list = get_reordered_list(
            pages_data=pages_data,
            page_count=3
        )

        assert reordered_list == [3, 2, 1]

    def test_get_reordered_list_3(self):
        """
        In this scenario pages 3 and 4 were swapped.
        Document vesrsion is assumed to have 4 pages.
        """
        pages_data = [
            {'id': 3, 'old_number': 3, 'new_number': 4},
            {'id': 4, 'old_number': 4, 'new_number': 3}
        ]
        reordered_list = get_reordered_list(
            pages_data=pages_data,
            page_count=4
        )

        assert reordered_list == [1, 2, 4, 3]

    def test_get_assigns_after_delete_1(self):
        result = get_assigns_after_delete(
            total_pages=6, deleted_pages=[1, 2]
        )
        assert result == [(1, 3), (2, 4), (3, 5), (4, 6)]

    def test_get_assigns_after_delete_2(self):
        result = get_assigns_after_delete(
            total_pages=5, deleted_pages=[1, 5]
        )
        assert result == [(1, 2), (2, 3), (3, 4)]
