from enum import Enum

from pydantic import BaseModel, ConfigDict

from .feisar.field import Field


class EntityType(str, Enum):
    page = 'page'
    folder = 'folder'


class Page(BaseModel):
    """Index entity

    Documents are indexed by page. Note that we place in same index
    both folders and documents, and because the main index entity is page -
    we end up having in index two types of entities: folders and pages.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str = Field(primary_key=True)  # page id | node_id
    document_id: str | None = None  # document ID to whom this page belongs
    document_version_id: str | None = None  # ID of the document version
    user_id: str
    parent_id: str
    title: str  # document or folder title
    text: str | None = None  # text is None in case folder entity
    entity_type: EntityType  # Folder | Page
    #  tags: MultiValueField
    page_number: int | None = None  # None in case of folder entity
    page_count: int | None = None  # None in case of folder entity
