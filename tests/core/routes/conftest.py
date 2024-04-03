import base64
import json

import pytest


def b64e(s):
    return base64.b64encode(s.encode()).decode()


@pytest.fixture
def token():
    data = {
        'sub': '100',
        'preferred_username': 'montaigne',
        'email': 'montaingne@mail.com'
    }
    json_str = json.dumps(data)

    payload = b64e(json_str)

    return f"ignore_me.{payload}.ignore_me_too"
