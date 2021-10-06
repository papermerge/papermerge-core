from rest_framework.renderers import JSONRenderer as OrigJSONRenderer

from papermerge.core.rest import utils


class JSONRenderer(OrigJSONRenderer):
    """
    Override the render method of the django rest framework JSONRenderer to allow
    adding a resource_name root element to all GET requests formatted with JSON
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response_data = {}

        resource = utils.get_resource(context=renderer_context)
        response_data[resource] = data

        response = super().render(response_data, accepted_media_type, renderer_context)

        return response
