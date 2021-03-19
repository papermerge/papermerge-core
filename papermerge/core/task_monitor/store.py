
class InMemoryStore:
    pass


class RedisStore:

    def __init__(self, redis, timeout):
        self.redis = redis
        # keys timeout in seconds
        self.timeout = timeout

    def __getitem__(self, key):
        return self.redis.hgetall(key)

    def __setitem__(self, key, value):
        self.redis.hmset(key, value)

    def expire(self, key):
        self.redis.expire(key, self._timeout)
