from django.db import models


class SearchIndexField:
    def __init__(self, *args, model_attr=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.model_attr = model_attr


class TextField(SearchIndexField, models.TextField):
    pass


class ListField(SearchIndexField, models.TextField):
    pass


class NestedField(SearchIndexField, models.TextField):
    pass


class KeywordField(SearchIndexField, models.TextField):
    pass
