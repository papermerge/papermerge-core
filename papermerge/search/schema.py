from typing import Optional

from pydantic import ConfigDict
from salinic import types
from salinic.field import KeywordField, TextField, UUIDField
from salinic.schema import Schema
from typing_extensions import Annotated

FOLDER = 'folder'
PAGE = 'page'


class Model(Schema):
    """Index entity

    Documents are indexed by page. Note that we place in same index
    both folders and documents, and because the main index entity is page -
    we end up having in index two types of entities: folders and pages.
    """
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        lang_field_name='lang'
    )

    id: Annotated[
        str,
        UUIDField(primary_key=True, general_search=True)
    ]  # page id | node_id

    # document ID to whom this page belongs
    document_id: Annotated[
        Optional[str],
        UUIDField(index=False, general_search=True)
    ] = None

    lang: Annotated[
        str,
        KeywordField()
    ] = 'en'

    user_id: Annotated[
        str,
        UUIDField(index=False)
    ]

    title: Annotated[
        str,
        TextField(general_search=True, multi_lang=True)
    ]  # document or folder title

    # text is None in case folder entity
    text:  Annotated[
        Optional[str],
        TextField(general_search=True, multi_lang=True)
    ] = None

    # None in case of folder entity
    page_number: types.OptionalNumeric = None

    entity_type: Annotated[
        str,
        KeywordField()
    ]  # folder | page

    tags: Annotated[
        Optional[list[str]],
        KeywordField(multi_value=True)
    ] = []

    def __str__(self):
        return f'IndexEntity(id={self.id}, title={self.title}, '\
            f'document_id={self.document_id},' \
            f'number={self.page_number},' \
            f'text=|{self.text}|,' \
            f'type={self.entity_type})'
