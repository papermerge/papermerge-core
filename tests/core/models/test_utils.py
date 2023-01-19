import uuid
from papermerge.core.models.utils import uuid2raw_str


def test_uuid2raw_str_1():
    value = uuid.UUID('fb3b40b3-9d52-4681-86d0-a662f290d52c')
    expected_result = 'fb3b40b39d52468186d0a662f290d52c'
    actual_result = uuid2raw_str(value)

    assert actual_result == expected_result


def test_uuid2raw_str_2():
    value = uuid.UUID('175828f4-13f9-4f8b-8c27-125e2c744feb')
    expected_result = '175828f413f94f8b8c27125e2c744feb'
    actual_result = uuid2raw_str(value)

    assert actual_result == expected_result
