from typing import List, Optional, Tuple

from pydantic import BaseModel
from salinic import types
from salinic.field import IdField, KeywordField
from salinic.schema import Schema
from typing_extensions import Annotated

FOLDER = 'folder'
PAGE = 'page'


class ColoredTag(BaseModel):
    name: str
    fg_color: str
    bg_color: str


Tags = Annotated[
    Optional[list[ColoredTag]],
    KeywordField()  # will be indexed as a keyword
]
Breadcrumb = Annotated[
    List[Tuple[str, str]],
    KeywordField()  # will be indexed as a keyword
]


class IndexEntity(Schema):
    """Index entity

    Documents are indexed by page. Note that we place in same index
    both folders and documents, and because the main index entity is page -
    we end up having in index two types of entities: folders and pages.
    """
    id: Annotated[str, IdField(primary_key=True)]  # page id | node_id
    # document ID to whom this page belongs
    document_id: Annotated[Optional[str], IdField()] = None
    # ID of the document version
    document_version_id: Annotated[Optional[str], IdField()] = None
    user_id: str
    parent_id: str
    title: types.Text  # document or folder title
    # text is None in case folder entity
    text: types.OptionalText = None
    entity_type: types.Keyword  # Folder | Page
    breadcrumb: Breadcrumb
    tags: Tags = []
    # None in case of folder entity
    page_number: types.OptionalNumeric = None
    # None in case of folder entity
    page_count: types.OptionalNumeric = None

    def __str__(self):
        return f'IndexEntity(id={self.id}, title={self.title}, '\
            f'document_id={self.document_id},' \
            f'document_version_id={self.document_version_id},' \
            f'type={self.entity_type})'

    def get_idx_value__tags(self):
        return list([tag.name for tag in self.tags])

    def get_idx_value__breadcrumb(self):
        return list([item[1] for item in self.breadcrumb])
