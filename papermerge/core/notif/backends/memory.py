import json
import queue


class MemoryBackend:

    def __init__(self, url: str, channel, timeout) -> None:
        self._queue = queue.Queue()

    async def pop(self):
        result = self._queue.get()
        if result is not None:
            return json.loads(result[1].decode())

        return None

    async def push(self, value):
        json_data = json.dumps(value)
        self._queue.put(json_data)
