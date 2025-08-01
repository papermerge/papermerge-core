import pytest


@pytest.fixture
async def montaigne(make_user):
    return await make_user(username="montaigne")
