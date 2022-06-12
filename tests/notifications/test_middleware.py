from django.test import TestCase

from papermerge.notifications.middleware import (
    extract_from_auth_header,
    extract_from_sec_websocket_protocol_header,
    extract_token,
)


class TestMiddlewareUtils(TestCase):

    def test_extract_from_auth_header_positive(self):
        assert extract_from_auth_header("Token xyz") == "xyz"
        assert extract_from_auth_header("Token   xy9003gz  ") == "xy9003gz"
        assert extract_from_auth_header("   token   11xyz23sabc  ") == "11xyz23sabc"

    def test_extract_from_auth_header_negative(self):
        assert extract_from_auth_header(None) is None
        assert extract_from_auth_header('') is None
        # only token identifier (without value)
        assert extract_from_auth_header("token") is None
        # only value (without token identifier)
        assert extract_from_auth_header("value") is None
