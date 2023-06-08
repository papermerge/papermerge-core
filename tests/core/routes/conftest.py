import base64
import json
import pytest

from fastapi import FastAPI
from fastapi.testclient import TestClient


def b64e(s):
    return base64.b64encode(s.encode()).decode()


@pytest.fixture
def token():
    data = {
        'user_id': '100'
    }
    json_str = json.dumps(data)

    payload = b64e(json_str)

    return f"ignore_me.{payload}.ignore_me_too"


@pytest.fixture
def client():
    from papermerge.core.routers import register_routers

    app = FastAPI()
    register_routers(app)
    result = TestClient(app)

    return result
