from datetime import datetime
from papermerge.core.utils import misc


def test_str2date():
    assert misc.str2date("2024-10-30") == datetime(2024, 10, 30).date()
    assert misc.str2date("2024-10-30 00:00:00") == datetime(2024, 10, 30).date()


def test_str2float():
    assert misc.str2float("2024-10") == 2024.10
    assert misc.str2float("2024-12-30 00:00:00") == 2024.12
    assert misc.str2float("2024-03-25") == 2024.03
    assert misc.str2float("2024-03-22") == 2024.03
    assert misc.str2float("2024-03-01") == 2024.03
