import pytest

from papermerge.core.utils import base64


def test_decode():
    expected_result = {"user_id": "a1"}
    actual_result = base64.decode("eyJ1c2VyX2lkIjogImExIn0=")

    assert actual_result == expected_result


def test_encode():
    expected_result = "eyJ1c2VyX2lkIjogImExIn0="
    actual_result = base64.encode({"user_id": "a1"})

    assert actual_result == expected_result


@pytest.mark.parametrize("junk", [None, 1, 0, ""])
def test_decode_junk_input(junk):
    with pytest.raises(ValueError):
        base64.decode(junk)


@pytest.mark.parametrize("junk", [None, "", "Some string", 1, 0])
def test_encode_junk_input(junk):
    with pytest.raises(ValueError):
        base64.encode(junk)
