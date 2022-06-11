import logging

from channels.middleware import BaseMiddleware
from knox.models import AuthToken
from knox.settings import CONSTANTS

from channels.db import database_sync_to_async

logger = logging.getLogger(__name__)


HEADER_NAME = 'authorization'
TOKEN_NAME = 'token'

@database_sync_to_async
def get_user(token_key):
    try:
        token = AuthToken.objects.get(
            token_key=token_key[:CONSTANTS.TOKEN_KEY_LENGTH]
        )
        return token.user
    except AuthToken.DoesNotExist:
        return None


def extract_token(headers):
    """
    Returns token from list of headers

    #
    #  header_name    token_name   token_value
    #  Authorization: Token        <token>
    #
    """
    for _key, _value in headers:
        key = _key.decode()
        value = _value.decode()
        if key.lower() == HEADER_NAME:
            try:
                token_identifier, token_value = value.split(' ')
                if token_identifier and token_identifier.strip().lower() == TOKEN_NAME:
                    return token_value.strip()
            except ValueError:
                logger.warning(
                    f"Poorly formatted Authorization header {value}"
                )
                return None

    return None


class TokenAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):
        token_key = extract_token(headers=scope['headers'])

        if token_key is None:
            scope['user'] = None
        else:
            scope['user'] = await get_user(token_key)

        return await super().__call__(scope, receive, send)
