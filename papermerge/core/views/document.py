from django.views.generic.detail import DetailView

from papermerge.core.models import Document
from .mixins import HybridResponseMixin


class DocumentDetailView(HybridResponseMixin, DetailView):
    model = Document

    def get_data(self, context):
        context = {}
        context['document'] = self.object.to_dict()

        return context

    def render_to_response(self, context, **response_kwargs):
        resp = self.render_to_json_response(context, **response_kwargs)

        return resp
