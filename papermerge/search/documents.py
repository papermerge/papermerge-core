from django_elasticsearch_dsl import Document as ElasticSearchDocument
from django_elasticsearch_dsl.registries import registry

from papermerge.core.models import Page


@registry.register_document
class Page(ElasticSearchDocument):

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
        ]
