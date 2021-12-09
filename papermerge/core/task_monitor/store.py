import json
from redis import Redis


class RedisStore:

    def __init__(self, url, timeout):
        # With decode_responses=True argument redis client will
        # automatically encode returned bytes to UTF-8 strings
        self.redis = Redis.from_url(url, decode_responses=True)
        # keys timeout in seconds
        self.timeout = timeout

    def __getitem__(self, key):
        str_value = self.redis.get(key)

        if str_value:
            return json.loads(str_value)

        return None

    def __setitem__(self, key, value):
        self.redis.set(key, json.dumps(value))

    def get(self, key, default_value):
        value = self[key]
        if not value:
            return default_value

        return value

    def expire(self, key):
        self.redis.expire(key, self.timeout)

    def flushdb(self):
        self.redis.flushdb()

    def scan_iter(self, match=None, count=None, _type=None):
        return self.redis.scan_iter(match=match, count=count, _type=_type)
