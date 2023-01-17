from papermerge.core.backup_restore.utils import (
    RestoreSequence,
    breadcrumb_parts_count
)


def test_restore_sequence():
    input = [
        {'breadcrumb': '.home/'},
        {'breadcrumb': '.home/A/'},
        {'breadcrumb': '.home/A/B/'},
        {'breadcrumb': '.home/doc.pdf'},
        {'breadcrumb': '.inbox/'},
    ]
    actual_output = [
        item['breadcrumb'] for item in RestoreSequence(input)
    ]
    expected_output = [
        '.home/',
        '.inbox/',
        '.home/A/',
        '.home/doc.pdf',
        '.home/A/B/',
    ]

    assert expected_output == list(actual_output)


def test_breadcrumb_parts_count():
    assert 1 == breadcrumb_parts_count(
        {"breadcrumb": ".home/"}
    )
    assert 2 == breadcrumb_parts_count(
        {"breadcrumb": ".home/A/"}
    )
    assert 4 == breadcrumb_parts_count(
        {"breadcrumb": ".home/A/B/C"}
    )
    assert 3 == breadcrumb_parts_count(
        {"breadcrumb": ".home/A/doc.pdf"}
    )
    assert 1 == breadcrumb_parts_count(
        {"breadcrumb": ".inbox/"}
    )
    assert 2 == breadcrumb_parts_count(
        {"breadcrumb": ".inbox/doc.pdf"}
    )
