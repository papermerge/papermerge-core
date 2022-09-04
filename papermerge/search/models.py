from papermerge.core.models import (Folder, Document, DocumentVersion, Page)
from papermerge.core.utils import namespaced

from .indexes import SearchIndex, fields


class PageIndex(SearchIndex):

    document_version_id = fields.TextField(model_attr='document_version.id')
    document_id = fields.TextField(
        model_attr='document_version.document.id'
    )
    user_id = fields.TextField(
        model_attr='document_version.document.user.id'
    )
    title = fields.TextField(
        model_attr='document_version.document.title'
    )
    breadcrumb = fields.TextField()
    node_type = 'document'

    def prepare_breadcrumb(self, instance):
        doc = instance.document_version.document
        list_of_titles = [
            item.title for item in doc.get_ancestors(include_self=False)
        ]

        return ' / '.join(list_of_titles)

    class Meta:
        model = Page  # The model associated with this Document
        index_name = namespaced('pages')


class DocumentIndex(SearchIndex):

    text = fields.TextField()
    breadcrumb = fields.ListField(fields.TextField())
    node_type = 'document'
    user_id = fields.KeywordField()
    tags = fields.NestedField(properties={
        'name': fields.KeywordField(),
        'bg_color': fields.KeywordField(),
        'fg_color': fields.KeywordField(),
    })

    @property
    def highlight(self):
        return self.meta.highlight.text

    def prepare_breadcrumb(self, instance):
        breadcrumb_items = [
            item.title
            for item in instance.get_ancestors(include_self=False)
        ]
        return breadcrumb_items

    def prepare_text(self, instance):
        last_document_version = instance.versions.last()
        if last_document_version:
            return last_document_version.text

        return ''

    class Django:
        model = Document
        name = namespaced('documents')


class FolderIndex(SearchIndex):

    breadcrumb = fields.ListField()
    node_type = 'folder'
    user_id = fields.KeywordField()
    tags = fields.NestedField(properties={
        'name': fields.KeywordField(),
        'bg_color': fields.KeywordField(),
        'fg_color': fields.KeywordField(),
    })

    def prepare_breadcrumb(self, instance):
        breadcrumb_items = [
            item.title
            for item in instance.get_ancestors(include_self=False)
        ]
        return breadcrumb_items

    class Meta:
        model = Folder  # The model associated with this Document
        name = namespaced('folders')


class DocumentVersionIndex(SearchIndex):
    title = fields.TextField(model_attr='document.title')

    class Meta:
        model = DocumentVersion
        name = namespaced('document_versions')
