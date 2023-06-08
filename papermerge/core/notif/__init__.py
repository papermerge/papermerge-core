import json
import redis.asyncio as redis


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
        self._redis = redis.from_url(url)
        self._channel = channel
        self._timeout = timeout

    async def __aiter__(self):
        while True:
            result = await self._redis.blpop(self._channel, self._timeout)
            if result is not None:
                yield json.loads(result[1].decode())
