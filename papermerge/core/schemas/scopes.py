from typing import Dict

from pydantic import RootModel

ScopesBase = RootModel[Dict[str, str]]


class Scopes(ScopesBase):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "node.create": "Create nodes",
                    "node.view": "View nodes",
                    "node.update": "Update nodes",
                    "document.download": "Download documents"
                },
            ]
        }
    }
