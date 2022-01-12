from django_elasticsearch_dsl import Document as ElasticSearchDocument
from django_elasticsearch_dsl import fields as es_fields
from django_elasticsearch_dsl.registries import registry

from papermerge.core.models import (Folder, Document, DocumentVersion, Page)


@registry.register_document
class PageIndex(ElasticSearchDocument):

    page_id = es_fields.TextField()
    document_version_id = es_fields.TextField()
    document_id = es_fields.TextField()
    user_id = es_fields.TextField()
    title = es_fields.TextField()
    breadcrumb = es_fields.TextField()

    def prepare_page_id(self, instance):
        return str(instance.id)

    def prepare_document_version_id(self, instance):
        return str(instance.document_version.id)

    def prepare_document_id(self, instance):
        return str(instance.document_version.document.id)

    def prepare_user_id(self, instance):
        return str(instance.document_version.document.user.id)

    def prepare_title(self, instance):
        return instance.document_version.document.title

    def prepare_breadcrumb(self, instance):
        doc = instance.document_version.document
        list_of_titles = [
            item.title for item in doc.get_ancestors(include_self=False)
        ]

        return ' / '.join(list_of_titles)

    class Index:
        # Name of the Elasticsearch index
        name = 'pages'
        # See Elasticsearch Indices API reference for available settings
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = Page  # The model associated with this Document

        # The fields of the model you want to be indexed in Elasticsearch
        fields = [
            'text',
            'number',
            'page_count',
            'lang'
        ]


@registry.register_document
class DocumentIndex(ElasticSearchDocument):

    text = es_fields.TextField()
    breadcrumb = es_fields.ListField(es_fields.TextField())
    node_type = 'document'
    user_id = es_fields.KeywordField()

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

    class Index:
        # Name of the Elasticsearch index
        name = 'documents'
        # See Elasticsearch Indices API reference for available settings
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = Document
        # DocumentIndex is updated via DocumentVersionIndex().update(...)
        ignore_signals = False

        # The fields of the model you want to be indexed in Elasticsearch
        fields = [
            'id',
            'title',
            'lang',
        ]


@registry.register_document
class FolderIndex(ElasticSearchDocument):

    breadcrumb = es_fields.ListField(es_fields.TextField())
    node_type = 'folder'
    user_id = es_fields.KeywordField()

    def prepare_breadcrumb(self, instance):
        breadcrumb_items = [
            item.title
            for item in instance.get_ancestors(include_self=False)
        ]
        return breadcrumb_items

    class Index:
        # Name of the Elasticsearch index
        name = 'folders'
        # See Elasticsearch Indices API reference for available settings
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = Folder  # The model associated with this Document

        # The fields of the model you want to be indexed in Elasticsearch
        fields = [
            'id',
            'title',
        ]


@registry.register_document
class DocumentVersionIndex(ElasticSearchDocument):
    title = es_fields.TextField()

    def prepare_title(self, instance):
        return instance.document.title

    class Index:
        name = 'document_versions'
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = DocumentVersion

        fields = [
            'id',
            'text',
            'lang',
            'file_name',
            'number'
        ]

    def update(self, thing, refresh=None, action='index', parallel=False, **kwargs):
        document_instance = thing.document
        DocumentIndex().update(document_instance, refresh, action, parallel, **kwargs)
        return super().update(thing, refresh, action, parallel, **kwargs)
