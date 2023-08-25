import json
import logging
from queue import Queue

from papermerge.core.notif import Event

logger = logging.getLogger(__name__)


class MemoryBackend:

    def __init__(self, url: str, channel, timeout) -> None:
        self._queue = Queue()

    async def pop(self) -> Event | None:
        logger.debug("POP")
        value = self._queue.get()
        logger.debug(f"Pop value={value} from the queue")
        if value is not None:
            attrs = json.loads(value)
            return Event(**attrs)

        return None

    def push(self, value: Event):
        attrs = value.model_dump()
        logger.debug("PUSH")
        json_data = json.dumps(attrs)
        logger.debug(f"Push value={value} to the queue")
        self._queue.put(json_data)
