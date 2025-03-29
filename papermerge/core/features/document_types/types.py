from enum import Enum

from papermerge.core.types import PaginatedQueryParams as BaseParams


class OrderBy(str, Enum):
    name_asc = "name"
    name_desc = "-name"
    owner_asc = "group_name"
    owner_desc = "-group_name"


class PaginatedQueryParams(BaseParams):
    order_by: OrderBy | None = None
