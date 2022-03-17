from elasticsearch_dsl import Q

from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer

from papermerge.core.views.mixins import RequireAuthMixin
from papermerge.search.serializers import SearchResultSerializer
from papermerge.search.documents import FolderIndex, DocumentIndex


class SearchView(RequireAuthMixin, GenericAPIView):
    resource_name = 'search'
    serializer_class = SearchResultSerializer
    renderer_classes = [JSONRenderer]

    def get(self, request):
        query_text = request.query_params.get('q', '')
        match = Q('match', title=query_text)
        wildcard = Q('wildcard', title=f'*{query_text}*')

        folders_result = FolderIndex.search().query(
            'match',
            user_id=request.user.pk
        ).query(match | wildcard)

        documents_result = DocumentIndex.search().query(
            'match',
            user_id=request.user.pk
        ).query(
            'multi_match',
            query=query_text,
            fields=['title', 'text'],
            type='phrase_prefix',
        ).highlight(
            'text',
            fragment_size=25
        )

        result_list = list(folders_result) + list(documents_result)
        serializer = SearchResultSerializer(result_list, many=True)

        return Response(serializer.data)
