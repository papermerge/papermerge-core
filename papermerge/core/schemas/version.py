from pydantic import BaseModel


class Version(BaseModel):
    version: str
