import logging
from collections.abc import Iterator
from urllib.parse import urlparse

from django.conf import settings

from papermerge.core.notif.backends.base import BaseBackend

from .events import Event, EventName, OCREvent, State  # noqa

logger = logging.getLogger(__name__)


class Notification:
    """
    Yields asynchronously notifications from given redis channel.

    Example of usage:

    Consume messages:
        from papermerge.core.notif import Notification

        notif = Notification("redis://localhost", channel="cha:1")
        async for message in notif:
            await websocket.send_text(f"Message text was: {message}")

    Publish messages:

        import sys
        import json
        import redis


        r = redis.from_url("redis://localhost")
        json_data = json.dumps({"type": "worker.ocr", "data": "something"})
        r.rpush("cha:1", json_data)
    """
    def __init__(self, url, channel: str = "channel:1", timeout: int = 2):
        self._backend: BaseBackend
        parsed_url = urlparse(url)

        if parsed_url.scheme in ("redis", "rediss"):
            logger.debug(f"Loading Redis {url} notification backend")
            from papermerge.core.notif.backends.redis import RedisBackend
            self._backend = RedisBackend(url, channel=channel, timeout=timeout)
        elif parsed_url.scheme == "memory":
            logger.debug(f"Loading Memory {url} notification backend")
            from papermerge.core.notif.backends.memory import MemoryBackend
            self._backend = MemoryBackend(url, channel=channel, timeout=timeout)

    def push(self, value: Event):
        logger.debug(f"PUSH value={value}")
        self._backend.push(value)

    async def pop(self) -> Event:
        result = await self._backend.pop()
        return result

    async def __aiter__(self) -> Iterator[Event]:
        while True:
            result = await self.pop()
            if result is not None:
                yield result


notification = Notification(settings.NOTIFICATION_URL)
