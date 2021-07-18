import json

from django.views.generic import TemplateView

from papermerge.core.models import BaseTreeNode
from .mixins import JSONResponseMixin


class NodesView(JSONResponseMixin, TemplateView):
    """
    DELETE /nodes/ (content type: application/json)

    body is expected to be json array like below:

        [{id: 1}, {id: 2}, ...]
    """

    model = BaseTreeNode

    def get_queryset(self):
        data = json.loads(self.request.body)
        node_ids = [item['id'] for item in data]
        qs = self.model.objects.filter(id__in=node_ids)

        return qs

    def render_to_response(self, context, **response_kwargs):
        if self.asks_for_json:  # provided by JSONResponseMixin
            resp = self.render_to_json_response(context, **response_kwargs)
        else:
            resp = super().render_to_response(context, **response_kwargs)

        return resp

    def delete(self, request, *args, **kwargs):
        self.get_queryset().delete()
