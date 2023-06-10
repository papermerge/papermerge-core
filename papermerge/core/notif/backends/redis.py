import json
import redis.asyncio as redis


class RedisBackend:

    def __init__(self, url: str, channel, timeout) -> None:
        self._redis = redis.from_url(url)
        self._channel = channel
        self._timeout = timeout

    async def pop(self):
        result = await self._redis.blpop(self._channel, self._timeout)
        if result is not None:
            return json.loads(result[1].decode())

        return None

    async def push(self, value):
        json_data = json.dumps(value)
        await self._redis.rpush("cha:1", json_data)
