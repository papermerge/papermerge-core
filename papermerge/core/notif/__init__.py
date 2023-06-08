from papermerge.core.notif.backends.base import BaseBackend
from urllib.parse import urlparse


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
            from papermerge.core.notif.backends.redis import RedisBackend
            self._backend = RedisBackend(url, channel=channel, timeout=timeout)
        elif parsed_url.scheme == "memory":
            from papermerge.core.notif.backends.memory import MemoryBackend
            self._backend = MemoryBackend(url, channel=channel, timeout=timeout)

    async def __aiter__(self):
        while True:
            result = await self._backend.pop()
            if result is not None:
                yield result
