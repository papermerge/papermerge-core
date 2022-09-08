from haystack import indexes
from papermerge.core.models import DocumentVersion, Folder


class DocumentVersionIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, use_template=True)
    doc = indexes.CharField(model_attr='document')
    user = indexes.CharField(model_attr='document.user')
    document_text = indexes.CharField(model_attr='text')

    def get_model(self):
        return DocumentVersion


class FolderIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True, use_template=True)
    title = indexes.CharField(model_attr='title')
    user = indexes.CharField(model_attr='user')

    def get_model(self):
        return Folder
