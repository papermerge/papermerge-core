import logging
import json
from asyncio import Queue


logger = logging.getLogger(__name__)


class MemoryBackend:

    def __init__(self, url: str, channel, timeout) -> None:
        self._queue = Queue()

    async def pop(self):
        logger.debug("POP")
        value = await self._queue.get()
        logger.debug(f"Pop value={value} from the queue")
        if value is not None:
            return json.loads(value)

        return None

    async def push(self, value):
        logger.debug("PUSH")
        json_data = json.dumps(value)
        logger.debug(f"Push value={value} to the queue")
        await self._queue.put(json_data)
