import json

import redis
import redis.asyncio as redis_async

from papermerge.core.notif import Event


class RedisBackend:

    def __init__(self, url: str, channel, timeout) -> None:
        self._async_redis = redis_async.from_url(url)
        self._redis = redis.from_url(url)
        self._channel = channel
        self._timeout = timeout

    async def pop(self) -> Event | None:
        result = await self._async_redis.blpop(self._channel, self._timeout)
        if result is not None:
            attrs = json.loads(result[1].decode())
            return Event(**attrs)

        return None

    def push(self, value: Event):
        attrs = value.dict()
        json_data = json.dumps(attrs)
        self._redis.rpush("cha:1", json_data)
