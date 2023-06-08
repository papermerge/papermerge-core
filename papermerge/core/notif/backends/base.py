

class BaseBackend:
    def __init__(self, url: str) -> None:
        raise NotImplementedError()

    async def pop(self) -> None:
        raise NotImplementedError()

    async def push(self, value) -> None:
        raise NotImplementedError()

    async def __aiter__(self):
        while True:
            result = await self.pop()
            if result is not None:
                yield result
