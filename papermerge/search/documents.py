from django_elasticsearch_dsl import Document as ElasticSearchDocument
from django_elasticsearch_dsl import fields as es_fields
from django_elasticsearch_dsl.registries import registry

from papermerge.core.models import Page as CorePage
from papermerge.core.models import Document as CoreDocument
from papermerge.core.models import Folder as CoreFolder


@registry.register_document
class Page(ElasticSearchDocument):

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
        model = CorePage  # The model associated with this Document

        # The fields of the model you want to be indexed in Elasticsearch
        fields = [
            'text',
            'number',
            'page_count',
            'lang'
        ]


@registry.register_document
class Document(ElasticSearchDocument):

    text = es_fields.TextField()

    class Index:
        # Name of the Elasticsearch index
        name = 'documents'
        # See Elasticsearch Indices API reference for available settings
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = CoreDocument  # The model associated with this Document

        # The fields of the model you want to be indexed in Elasticsearch
        fields = [
            'title',
            'lang',
        ]


@registry.register_document
class Folder(ElasticSearchDocument):

    class Index:
        # Name of the Elasticsearch index
        name = 'folders'
        # See Elasticsearch Indices API reference for available settings
        settings = {
            'number_of_shards': 1,
            'number_of_replicas': 0
        }

    class Django:
        model = CoreFolder  # The model associated with this Document

        # The fields of the model you want to be indexed in Elasticsearch
        fields = [
            'title',
        ]
