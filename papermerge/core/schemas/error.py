from pydantic import BaseModel

class AttrError(BaseModel):
    name: str
    message: str


class Error(BaseModel):
    attrs: list[AttrError] | None = None
    messages: list[str] | None = None
