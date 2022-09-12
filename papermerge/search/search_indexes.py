from haystack import indexes
from papermerge.core.models import Document, Folder


class DocumentIndex(indexes.SearchIndex, indexes.Indexable):
    indexed_content = indexes.CharField(document=True, use_template=True)
    id = indexes.CharField(model_attr='id')
    user = indexes.CharField(model_attr='document__user')
    title = indexes.CharField(model_attr='title')
    last_version_text = indexes.CharField()
    text = indexes.CharField()  # alias for `last_version_text`
    tags = indexes.MultiValueField()
    highlight = indexes.CharField()
    breadcrumb = indexes.MultiValueField()
    node_type = indexes.CharField()

    def prepare_last_version_text(self, obj):
        last_document_version = obj.versions.last()
        if last_document_version:
            return last_document_version.text

        return ''

    def prepare_breadcrumb(self, instance):
        list_of_titles = [
            item.title for item in instance.get_ancestors(include_self=False)
        ]

        return list_of_titles

    def prepare_node_type(self, obj):
        return 'document'

    def prepare_text(self, obj):
        return self.prepare_last_version_text(obj)

    def prepare_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_model(self):
        return Document


class FolderIndex(indexes.SearchIndex, indexes.Indexable):
    indexed_content = indexes.CharField(document=True, use_template=True)
    id = indexes.CharField(model_attr='id')
    title = indexes.CharField(model_attr='title')
    user = indexes.CharField(model_attr='user')
    node_type = indexes.CharField()
    breadcrumb = indexes.MultiValueField()
    tags = indexes.MultiValueField()

    def prepare_breadcrumb(self, instance):
        breadcrumb_items = [
            item.title
            for item in instance.get_ancestors(include_self=False)
        ]
        return breadcrumb_items

    def prepare_node_type(self, obj):
        return 'folder'

    def prepare_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_model(self):
        return Folder
