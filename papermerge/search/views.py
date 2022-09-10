from django.db.models import QuerySet

from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer

from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter
)
from haystack.query import SearchQuerySet, SQ
from papermerge.core.views.mixins import RequireAuthMixin
from papermerge.search.serializers import SearchResultSerializer
from papermerge.search.constants import (
    TAGS_OP_ALL,
    TAGS_OP_ANY
)


class SearchView(RequireAuthMixin, GenericAPIView):
    """
    Performs full text search on the documents and folders.

    Folders are matched by their title and assigned tags.
    Documents are matched by title, OCRed text and assigned tags.
    """
    resource_name = 'search'
    serializer_class = SearchResultSerializer
    renderer_classes = [JSONRenderer]

    @extend_schema(
        operation_id="Search",
        parameters=[
            OpenApiParameter(
                name='q',
                description='text to search',
                required=True,
                type=str,
            ),
            OpenApiParameter(
                name='tags',
                description=f"""
                Comma delimited tags that should be assigned the node.
                By default uses `{TAGS_OP_ALL}` operator i.e. all tags listed
                here should be assgned to the node. For `{TAGS_OP_ANY}` operator
                use `tags_ap={TAGS_OP_ANY}`
                """,
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='tags_op',
                description=f"""
                Operator to use when searching by tag. Can be either
                `{TAGS_OP_ANY}` or `{TAGS_OP_ALL}`.
                Default value is `{TAGS_OP_ALL}`.
                For `{TAGS_OP_ANY}` - will return nodes with at least one of
                    the tags assigned.
                For `{TAGS_OP_ALL}` - will return only nodes with all of the
                tags assigned.
                """,
                required=False,
                type=str
            )
        ]
    )
    def get(self, request):
        query_text = request.query_params.get('q', '')
        if len(query_text) == 0:
            query_text = '*'
        query_tags = request.query_params.get('tags', '')
        tags_op = request.query_params.get('tags_op', TAGS_OP_ALL)
        #  never trust user input + make sure only valid options are used
        if tags_op not in (TAGS_OP_ALL, TAGS_OP_ANY):
            tags_op = TAGS_OP_ALL

        query_all = SearchQuerySet().filter(user=request.user)

        query_all = self.add_filter_by_tags(
            query=query_all,
            query_tags=query_tags,
            tags_op=tags_op
        )

        if query_text != '*':
            query_all = self.add_filter_by_content(
                query=query_all,
                query_text=query_text
            )

        query_all = query_all.highlight()
        serializer = SearchResultSerializer(query_all, many=True)

        return Response(serializer.data)

    def add_filter_by_content(
        self,
        query: SearchQuerySet,
        query_text: str
    ) -> SearchQuerySet:

        by_title = SQ(title__startswith=query_text.lower()) | SQ(
            title=query_text.lower()
        )
        by_content = SQ(last_version_text__contains=query_text) | SQ(
            last_version_text=query_text
        )

        return query.filter(by_content | by_title)

    def add_filter_by_tags(
        self,
        query: SearchQuerySet,
        query_tags: str,
        tags_op: str
    ) -> SearchQuerySet:

        if not query_tags:
            return query

        if tags_op == TAGS_OP_ALL:
            sq = SQ()
            for name in query_tags.split(','):
                sq = sq & SQ(tags__contain=name)
        else:
            # TAGS_OP_ANY
            sq = SQ()
            for name in query_tags.split(','):
                sq = sq | SQ(tags__contain=name)

        return query.filter(sq)

    def get_queryset(self):
        # This is workaround warning issued when runnnig
        # `./manage.py generateschema`
        # https://github.com/carltongibson/django-filter/issues/966
        if not self.request:
            return None

        queryset = self.queryset
        if isinstance(queryset, QuerySet):
            # Ensure queryset is re-evaluated on each request.
            queryset = queryset.all()
        return queryset
