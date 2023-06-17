import base64
import json
from collections.abc import Mapping


def decode(s: str) -> str:
    """Decodes given string from base64"""
    rem = len(s) % 4

    if rem > 0:
        s += "=" * (4 - rem)

    return base64.b64decode(s).decode()


def encode(dictionary: Mapping) -> str:
    """Returns base64 string of given dictionary"""
    base64_bytes = base64.b64encode(
        json.dumps(dictionary).encode("ascii")
    )

    return base64_bytes.decode('ascii')
