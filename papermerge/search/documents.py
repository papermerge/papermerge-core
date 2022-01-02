from django_elasticsearch_dsl import Document as ElasticSearchDocument
from django_elasticsearch_dsl import fields as es_fields
from django_elasticsearch_dsl.registries import registry

from papermerge.core.models import Page


@registry.register_document
class Page(ElasticSearchDocument):

    version_number = es_fields.IntegerField()
    document_title = es_fields.TextField()
    folder_title = es_fields.TextField()
    user_id = es_fields.IntegerField()
    breadcrump = es_fields.TextField()

    def prepare_version_number(self, instance):
        return instance.document_version.number

    def prepare_document_title(self, instance):
        return instance.document_version.document.title

    def prepare_folder_title(self, instance):
        return ""

    def prepare_user_id(self, instance):
        return ""

    def parepare_breadcrump(self, instance):
        return ""

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
