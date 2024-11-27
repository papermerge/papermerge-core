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


def test_float2str_with_float_as_input():
    assert misc.float2str(2024.01) == "2024-01"
    assert misc.float2str(2024.03) == "2024-03"
    assert misc.float2str(2024.09) == "2024-09"
    assert misc.float2str(2024.1) == "2024-10"
    assert misc.float2str(2024.10) == "2024-10"
    assert misc.float2str(2024.11) == "2024-11"
    assert misc.float2str(2024.12) == "2024-12"

    assert misc.float2str(2018.12) == "2018-12"
    assert misc.float2str(1983.06) == "1983-06"


def test_float2str_with_str_as_input():
    assert misc.float2str("2024.01") == "2024-01"
    assert misc.float2str("2024.03") == "2024-03"
    assert misc.float2str("2024.09") == "2024-09"
    assert misc.float2str("2024.1") == "2024-10"
    assert misc.float2str("2024.10") == "2024-10"
    assert misc.float2str("2024.11") == "2024-11"
    assert misc.float2str("2024.12") == "2024-12"

    assert misc.float2str("2018.12") == "2018-12"
    assert misc.float2str("1983.06") == "1983-06"
