from django.test import TestCase

from papermerge.notifications.middleware import (
    extract_from_auth_header,
    extract_from_sec_websocket_protocol_header,
    extract_token,
)


class TestMiddlewareUtils(TestCase):

    def test_extract_from_auth_header_positive(self):
        assert extract_from_auth_header("Token xyz") == "xyz"
        assert extract_from_auth_header("Token abc123") == "abc123"
        assert extract_from_auth_header("Token   xy9003gz  ") == "xy9003gz"
        assert extract_from_auth_header("   token   11xyz23sabc  ") == "11xyz23sabc"

    def test_extract_from_auth_header_negative(self):
        assert extract_from_auth_header(None) is None
        assert extract_from_auth_header('') is None
        # only token identifier (without value)
        assert extract_from_auth_header("token") is None
        # only value (without token identifier)
        assert extract_from_auth_header("value") is None

    def test_extract_sec_websocket_protocol_header_positive(self):
        assert extract_from_sec_websocket_protocol_header("access_token, xyz") == "xyz"
        assert extract_from_sec_websocket_protocol_header("access_token, abc123") == "abc123"
        assert extract_from_sec_websocket_protocol_header("access_token ,  xy9003gz  ") == "xy9003gz"
        assert extract_from_sec_websocket_protocol_header("   access_token ,  11xyz23sabc  ") == "11xyz23sabc"

    def test_extract_sec_websocket_protocol_header_negative(self):
        assert extract_from_sec_websocket_protocol_header(None) is None
        # no comma
        assert extract_from_sec_websocket_protocol_header("access_token   xy9003gz  ") is None
        assert extract_from_sec_websocket_protocol_header("   access_token   11xyz23sabc  ") is None

    def test_extract_token_positive_1(self):
        headers = [
            (b'host', b'127.0.0.1:8000'),
            (b'sec-websocket-protocol', b'access_token, abc123')
        ]

        assert extract_token(headers) == "abc123"

    def test_extract_token_positive_2(self):
        headers = [
            (b'host', b'127.0.0.1:8000'),
            (b'authorization', b'token abc123zwq')
        ]

        assert extract_token(headers) == "abc123zwq"

    def test_extract_token_negative(self):
        headers = [
            (b'host', b'127.0.0.1:8000'),
            (b'origin', b'localhost:4200')
        ]

        assert extract_token(headers) is None
