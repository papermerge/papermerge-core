from haystack import indexes
from papermerge.core.models import DocumentVersion


class DocumentVersionIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, use_template=True)
    document = indexes.CharField(model_attr='document')
    document_text = indexes.CharField(model_attr='text')

    def get_model(self):
        return DocumentVersion

    def index_queryset(self, using=None):
        """Used when the entire index for model is updated."""
        return self.get_model().objects
