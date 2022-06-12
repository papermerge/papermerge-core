import re
import logging

from channels.middleware import BaseMiddleware
from knox.models import AuthToken
from knox.settings import CONSTANTS
from knox.crypto import hash_token

from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)

try:
    from hmac import compare_digest
except ImportError:
    def compare_digest(a, b):
        return a == b


HEADER_NAME = 'authorization'
TOKEN_NAME = 'token'
SEC_WEBSOCKET_PROTOCOL = 'sec-websocket-protocol'
ACCESS_TOKEN_NAME = 'access_token'


@database_sync_to_async
def get_user(token_key):
    try:
        auth_token = AuthToken.objects.get(
            token_key=token_key[:CONSTANTS.TOKEN_KEY_LENGTH]
        )
    except AuthToken.DoesNotExist:
        return None

    digest = hash_token(token_key)

    if compare_digest(digest, auth_token.digest):
        if not auth_token.user.is_active:
            return None

        return auth_token.user

    return None


def extract_from_auth_header(value: str) -> str:

    if not value:
        return None

    try:
        token_identifier, token_value = re.split(r'\s+', value.strip())
        if token_identifier:
            token_identifier = token_identifier.strip().lower()
        if token_identifier == TOKEN_NAME:
            return token_value.strip()
    except ValueError:
        logger.warning(
            f"Poorly formatted Authorization header '{value}'"
        )
        return None


def extract_from_sec_websocket_protocol_header(value: str) -> str:
    if not value:
        return None

    try:
        token_access_identifier, token_value = value.split(',')
        if token_access_identifier:
            token_access_identifier = token_access_identifier.strip().lower()
        if token_access_identifier == ACCESS_TOKEN_NAME:
            return token_value.strip()
    except ValueError:
        logger.warning(
            f"Poorly formatted Sec-WebSocket-Protocol header {value}"
        )
        return None


def extract_token(headers):
    """
    Returns token from list of headers

    Token can be passed in two ways (or formats):
    1. Authorization: Token <value>
    2. Sec-WebSocket-Protocol: access_token, <value>

    First case may be used by command line utilities.
    Second case is used by browser clients via

        WebSocket(url, ['access_token', token])

    If no token header was found, returns None.
    """
    for _key, _value in headers:
        key = _key.decode().lower()
        value = _value.decode()
        if key == HEADER_NAME:
            return extract_from_auth_header(value)
        if key == SEC_WEBSOCKET_PROTOCOL:
            return extract_from_sec_websocket_protocol_header(value)

    return None


class TokenAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):
        token_key = extract_token(headers=scope['headers'])

        if token_key is None:
            scope['user'] = None
        else:
            scope['user'] = await get_user(token_key)

        return await super().__call__(scope, receive, send)
