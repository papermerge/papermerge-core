import json
import redis.asyncio as redis

from papermerge.core.notif import Event


class RedisBackend:

    def __init__(self, url: str, channel, timeout) -> None:
        self._redis = redis.from_url(url)
        self._channel = channel
        self._timeout = timeout

    async def pop(self) -> Event | None:
        result = await self._redis.blpop(self._channel, self._timeout)
        if result is not None:
            attrs = json.loads(result[1].decode())
            return Event(**attrs)

        return None

    async def push(self, value: Event):
        attrs = value.dict()
        json_data = json.dumps(attrs)
        await self._redis.rpush("cha:1", json_data)
