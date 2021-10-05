from rest_framework.renderers import JSONRenderer as OrigJSONRenderer


class JSONRenderer(OrigJSONRenderer):
    """
        Override the render method of the django rest framework JSONRenderer to allow
        adding a resource_name root element to all GET requests formatted with JSON
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response_data = {}

        # determine the resource name for this request - default to objects if not defined
        resource = getattr(renderer_context.get('view').get_serializer().Meta, 'resource_name', 'objects')
        response_data[resource] = data

        response = super().render(response_data, accepted_media_type, renderer_context)

        return response
