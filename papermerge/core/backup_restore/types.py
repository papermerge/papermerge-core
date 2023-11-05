from django.db.models.manager import BaseManager
from pydantic import field_validator

from papermerge.core.schemas import Document, Folder
from papermerge.core.schemas.users import User as BaseUser


class User(BaseUser):
    password: str
    nodes: list[Document | Folder] = []

    @field_validator("nodes", mode='before')
    def get_all_from_manager(cls, v: object) -> object:
        if isinstance(v, BaseManager):
            return list(v.all())
        return v
