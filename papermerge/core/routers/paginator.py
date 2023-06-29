from collections.abc import Sequence
from functools import wraps
from typing import Callable, Generic, TypeVar

from django.core.paginator import Paginator as DjangoPaginator
from django.db.models.query import QuerySet
from pydantic.generics import BaseModel, GenericModel

from .params import CommonQueryParams

T = TypeVar('T')


class PaginatorGeneric(GenericModel, Generic[T]):
    page_size: int
    page_number: int
    num_pages: int
    items: Sequence[T]


class Paginator(BaseModel):
    page_size: int
    page_number: int
    num_pages: int
    items: Sequence

    def __init__(
        self,
        qs: QuerySet,
        page_size: int,
        page_number: int,
        **kwargs
    ):
        paginator = DjangoPaginator(qs, page_size)

        super().__init__(
            page_size=page_size,
            page_number=page_number,
            num_pages=paginator.num_pages,
            items=list(paginator.get_page(page_number).object_list),
            **kwargs
        )

    class Config:
        arbitrary_types_allowed = True


def paginate(func: Callable) -> Callable:

    @wraps(func)
    def view_with_pagination(*args, **kwargs):
        params: CommonQueryParams = kwargs['params']
        queryset = func(*args, **kwargs)

        return Paginator(
            queryset,
            page_size=params.page_size,
            page_number=params.page_number
        )

    return view_with_pagination
