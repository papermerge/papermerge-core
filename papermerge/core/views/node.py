import json

from django.views.generic import TemplateView

from papermerge.core.models import (
    BaseTreeNode,
    Document
)
from .mixins import JSONResponseMixin


class NodesView(JSONResponseMixin, TemplateView):
    """
    DELETE /nodes/ (content type: application/json)

    body is expected to be json array like below:

        [{id: 1}, {id: 2}, ...]
    """

    model = BaseTreeNode

    def get_data(self, context={}):
        data = json.loads(self.request.body)
        return data

    def get_queryset(self):
        data = self.get_data()
        node_ids = [item['id'] for item in data['nodes']]
        qs = self.model.objects.filter(id__in=node_ids)
        return qs

    def render_to_response(self, context, **response_kwargs):
        if self.asks_for_json:  # provided by JSONResponseMixin
            resp = self.render_to_json_response(context, **response_kwargs)
        else:
            resp = super().render_to_response(context, **response_kwargs)

        return resp

    def delete(self, request, *args, **kwargs):
        context = self.get_data()
        self.get_queryset().delete()
        return self.render_to_response(context)


class NodesMoveView(JSONResponseMixin, TemplateView):
    """
    POST /nodes/move/ (content type: application/json)

    Moves nodes to given target/parent.
    Body is expected to be json array like below:

        nodes: [{id: 1}, {id: 2}, ...]
        parent: {id: 34}
    """

    model = BaseTreeNode

    def get_data(self, context={}):
        data = json.loads(self.request.body)
        return data

    def get_queryset(self):
        data = self.get_data()
        node_ids = [item['id'] for item in data['nodes']]
        qs = self.model.objects.filter(id__in=node_ids)
        return qs

    def post(self, request, *args, **kwargs):
        context = self.get_data()
        parent = self._get_target(context)

        for node in self.get_queryset():
            node.refresh_from_db()
            if parent:
                parent.refresh_from_db()
            Document.objects.move_node(node, parent)

        return self.render_to_json_response(context)

    def _get_target(self, context):
        parent_id = None
        parent = None
        if context.get('target', None):
            parent_id = context.get('target', None).get('id', None)
            if parent_id:
                try:
                    parent = self.model.objects.get(id=parent_id)
                except Exception:
                    return None

        return parent
