from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer

from papermerge.core.views.mixins import RequireAuthMixin
from papermerge.search.serializers import SearchResultSerializer
from papermerge.search.documents import PageIndex


class SearchView(RequireAuthMixin, GenericAPIView):
    resource_name = 'search'
    serializer_class = SearchResultSerializer
    renderer_classes = [JSONRenderer]

    def get(self, request):
        query_text = request.query_params['q']

        result = PageIndex.search().query('term', text=query_text)

        result_list = list(result)
        serializer = SearchResultSerializer(result_list, many=True)

        return Response(serializer.data)
