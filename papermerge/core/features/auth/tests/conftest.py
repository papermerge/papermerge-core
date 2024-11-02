import pytest


@pytest.fixture
def montaigne(make_user):
    return make_user(username="montaigne")
