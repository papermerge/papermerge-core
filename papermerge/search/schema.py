from typing import Optional

from salinic.field import IdField, KeywordField, NumericField, TextField
from salinic.schema import Schema

FOLDER = 'folder'
PAGE = 'page'


class IndexEntity(Schema):
    """Index entity

    Documents are indexed by page. Note that we place in same index
    both folders and documents, and because the main index entity is page -
    we end up having in index two types of entities: folders and pages.
    """
    id: str = IdField(primary_key=True)  # page id | node_id
    # document ID to whom this page belongs
    document_id: Optional[str] = IdField()
    # ID of the document version
    document_version_id: Optional[str] = IdField()
    user_id: str
    parent_id: str
    title: str = TextField()  # document or folder title
    text: Optional[str] = TextField()  # text is None in case folder entity
    entity_type: str = KeywordField()  # Folder | Page
    tags: list[str] | None = KeywordField()
    page_number: Optional[int] = NumericField()  # None in case of folder entity
    page_count: Optional[int] = NumericField()  # None in case of folder entity

    def __str__(self):
        return f'IndexEntity(id={self.id}, title={self.title}, '\
            f'document_id={self.document_id},' \
            f'document_version_id={self.document_version_id},' \
            f'type={self.entity_type})'
