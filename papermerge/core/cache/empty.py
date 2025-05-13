class Client:

    def get(self, key):
        return None

    def set(self, key, value, ex: int = 60): ...


def get_client():
    return Client()
