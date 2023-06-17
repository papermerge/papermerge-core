import base64
import json
from collections.abc import Mapping


def decode(s: str) -> Mapping:
    """Decodes given string from base64 to a python dictionary

    In other words it receives as argument a python
    string which base64 representation of a python
    dict, decode the base64 string and returns the
    dictionary.

    Example:

         'eyJ1c2VyX2lkIjogImExIn0=' -> {'user_id': 'a1'}

    In command line:

         > echo -n 'eyJ1c2VyX2lkIjogImExIn0=' | base64 -d
         > {"user_id": "a1"}
    """
    if not isinstance(s, str):
        raise ValueError("Input should be a string")

    if len(s) == 0:
        raise ValueError("Input should be non-empty string")

    rem = len(s) % 4

    if rem > 0:
        s += "=" * (4 - rem)

    json_str = base64.b64decode(s).decode()
    return json.loads(json_str)


def encode(dictionary: Mapping) -> str:
    """Returns base64 string of given python dictionary

    In other words it receives as argument python
    dictionary object e.g. {'user_id': 'a1'} and
    returns a string which is the encoding of the above-mentioned
    dictionary into base64. The result is a
    python string.

    Example:

        {'user_id': 'a1'} -> 'eyJ1c2VyX2lkIjogImExIn0='

    Command line:

        > echo -n '{"user_id": "a1"}' | base64
        > eyJ1c2VyX2lkIjogImExIn0=

    """
    if not isinstance(dictionary, Mapping):
        raise ValueError("Input should a dictionary")

    base64_bytes = base64.b64encode(
        json.dumps(dictionary).encode("ascii")
    )

    return base64_bytes.decode('ascii')
