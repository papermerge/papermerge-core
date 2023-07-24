from enum import Enum

from feisar.field import Field, MultiValueField
from pydantic import BaseModel


class EntityType(str, Enum):
    page = 'page'
    folder = 'folder'


class Page(BaseModel):
    """Index entity

    Documents are indexed by page. Note that we place in same index
    both folders and documents, and because the main index entity is page -
    we end up having in index two types of entities: folders and pages.
    """
    id: str = Field(primary_key=True)  # page id
    document_id: str | None  # document ID to whom this page belongs
    document_version_id: str | None  # ID of the document version
    user_id: str
    parent_id: str
    title: str  # document or folder title
    text: str | None  # text is None in case folder entity
    entity_type: EntityType  # Folder | Page
    tags: MultiValueField
    page_number: int | None  # None in case of folder entity
    total_pages: int | None  # None in case of folder entity
