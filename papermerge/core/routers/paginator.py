from collections.abc import Sequence
from functools import wraps
from typing import Callable, Generic, TypeVar

from django.core.paginator import Paginator as DjangoPaginator
from django.db.models.query import QuerySet
from pydantic import BaseModel, ConfigDict

from .params import CommonQueryParams

T = TypeVar('T')


class PaginatorGeneric(BaseModel, Generic[T]):
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

    # Config
    model_config = ConfigDict(arbitrary_types_allowed=True)


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


class PaginatedResponse(BaseModel, Generic[T]):
    page_size: int
    page_number: int
    num_pages: int
    items: Sequence[T]

    model_config = ConfigDict(from_attributes=True)


def paginate2(
    params: CommonQueryParams,
    query,
    ResponseSchema: BaseModel
) -> PaginatedResponse[T]:

    paginated_query = query.offset(
        (params.page_number - 1) * params.page_size
    ).limit(params.page_size)

    return PaginatedResponse(
        num_pages=paginated_query.count(),
        page_number=params.page_number,
        page_size=params.page_size,
        items=[
            ResponseSchema.model_validate(item)
            for item in paginated_query.all()
        ],
    )
