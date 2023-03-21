from typing import TypeVar, Generic

from collections.abc import Sequence
from django.core.paginator import Paginator as DjangoPaginator
from django.db.models.query import QuerySet
from pydantic.generics import GenericModel, BaseModel


T = TypeVar('T')


class PaginatorGeneric(GenericModel, Generic[T]):
    per_page: int
    page_number: int
    num_pages: int
    items: Sequence[T]


class Paginator(BaseModel):
    per_page: int
    page_number: int
    num_pages: int
    items: Sequence

    def __init__(self, qs: QuerySet, per_page: int, page_number: int, **kwargs):
        paginator = DjangoPaginator(qs, per_page)

        super().__init__(
            per_page=per_page,
            page_number=page_number,
            num_pages=paginator.num_pages,
            items=list(paginator.get_page(page_number).object_list),
            **kwargs
        )

    class Config:
        arbitrary_types_allowed = True
