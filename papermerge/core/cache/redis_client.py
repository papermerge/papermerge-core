import redis


class Client:
    def __init__(self, url):
        self.url = url
        self.client = redis.from_url(url)

    def get(self, key):
        if self.client.exists(key):
            return self.client.get(key).decode("utf-8")

        return None

    def set(self, key, value, ex: int = 60):
        """ex is number of SECONDS until key expires"""
        self.client.set(key, value, ex)


def get_client(url):
    return Client(url)
