import pytest

from papermerge.core.notif import notification


@pytest.mark.asyncio
async def test_memory_backend():
    await notification.push({"message": "hi!"})

    message = await notification.pop()
    assert message == {"message": "hi!"}
