from redis import Redis


class GenericStore(dict):
    """
    Generic store used in testing.
    """

    def expire(self, key):
        pass

    def scan_iter(self, match=None, count=None, _type=None):
        for key, value in self.items():
            new_match = match.replace('*', '')
            if key.startswith(new_match):
                yield value


class RedisStore:
    """
    Redis store used (by default) in development and production.
    """

    def __init__(self, url, timeout):
        # With decode_responses=True argument redis client will
        # automatically encode returned bytes to UTF-8 strings
        self.redis = Redis.from_url(url, decode_responses=True)
        # keys timeout in seconds
        self.timeout = timeout

    def __getitem__(self, key):
        return self.redis.hgetall(key)

    def __setitem__(self, key, value):
        self.redis.hmset(key, value)

    def get(self, key, default_value):
        value = self[key]
        if not value:
            return default_value

        return value

    def expire(self, key):
        self.redis.expire(key, self.timeout)

    def scan_iter(self, match=None, count=None, _type=None):
        return self.redis.scan_iter(match=match, count=count, _type=_type)
