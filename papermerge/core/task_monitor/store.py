from redis import Redis


class InMemoryStore:
    pass


class RedisStore:

    def __init__(self, url, timeout):
        self.redis = Redis.from_url(url)
        # keys timeout in seconds
        self.timeout = timeout

    def __getitem__(self, key):
        return self.redis.hgetall(key)

    def __setitem__(self, key, value):
        self.redis.hmset(key, value)

    def expire(self, key):
        self.redis.expire(key, self.timeout)
