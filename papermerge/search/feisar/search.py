from .search_query import SearchQuery


class Search:
    def __init__(self, entity):
        self._entity = entity

    def query(self, *args, **kwargs) -> SearchQuery:
        return SearchQuery(self._entity, *args, **kwargs)
