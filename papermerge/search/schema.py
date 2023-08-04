from typing import Optional

from salinic.field import IdField, KeywordField, NumericField, TextField
from salinic.schema import Schema
from typing_extensions import Annotated

FOLDER = 'folder'
PAGE = 'page'


class IndexEntity(Schema):
    """Index entity

    Documents are indexed by page. Note that we place in same index
    both folders and documents, and because the main index entity is page -
    we end up having in index two types of entities: folders and pages.
    """
    id: Annotated[str, IdField(primary_key=True)]  # page id | node_id
    # document ID to whom this page belongs
    document_id: Annotated[Optional[str], IdField()]
    # ID of the document version
    document_version_id: Annotated[Optional[str], IdField()]
    user_id: str
    parent_id: str
    title: Annotated[str, TextField()]  # document or folder title
    # text is None in case folder entity
    text: Annotated[Optional[str], TextField()]
    entity_type: Annotated[str, KeywordField()]  # Folder | Page
    tags: Annotated[Optional[list[str]], KeywordField()]
    # None in case of folder entity
    page_number: Annotated[Optional[int], NumericField()]
    # None in case of folder entity
    page_count: Annotated[Optional[int], NumericField()]

    def __str__(self):
        return f'IndexEntity(id={self.id}, title={self.title}, '\
            f'document_id={self.document_id},' \
            f'document_version_id={self.document_version_id},' \
            f'type={self.entity_type})'
