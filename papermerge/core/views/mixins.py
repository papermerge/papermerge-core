from django.http import (
    JsonResponse,
    HttpResponse
)
from rest_framework.permissions import IsAuthenticated


class RequireAuthMixin:
    permission_classes = [IsAuthenticated]


class JSONResponseMixin:
    """
    A mixin that can be used to render a JSON response.
    """
    @property
    def asks_for_json(self):
        return any([
            'application/json' in self.request.headers.get('Content-Type', []),
            'application/json' in self.request.headers.get('Accept', [])
        ])

    def render_to_json_response(self, context, **response_kwargs):
        """
        Returns a JSON response, transforming 'context' to make the payload.
        """
        return JsonResponse(
            self.get_data(context),
            **response_kwargs
        )

    def get_data(self, context):
        """
        Returns an object that will be serialized as JSON by json.dumps().
        """
        # Note: This is *EXTREMELY* naive; in reality, you'll need
        # to do much more complex handling to ensure that arbitrary
        # objects -- such as Django model instances or querysets
        # -- can be serialized as JSON.
        return context


class HybridResponseMixin:
    """
    A mixin that can be used to render JSON or SVG responses.
    """

    @property
    def asks_for_json(self):
        return any([
            'application/json' in self.request.headers.get('Content-Type', []),
            'application/json' in self.request.headers.get('Accept', [])
        ])

    @property
    def asks_for_svg(self):
        return any([
            'image/svg' in self.request.headers.get('Content-Type', []),
            'image/svg' in self.request.headers.get('Accept', [])
        ])

    def render_to_json_response(self, context, **response_kwargs):
        """
        Returns a JSON response, transforming 'context' to make the payload.
        """
        return JsonResponse(
            self.get_data(context),
            **response_kwargs
        )

    def render_to_svg_response(self, svg_image, **response_kwargs):
        """
        Returns SVG response
        """
        return HttpResponse(
            svg_image,
            content_type='image/svg',
            **response_kwargs
        )

    def render_to_json_bad_request(self, error_message):
        return JsonResponse(
            {'error': error_message}, status=400
        )

    def get_data(self, context):
        """
        Returns an object that will be serialized as JSON by json.dumps().
        """
        # Note: This is *EXTREMELY* naive; in reality, you'll need
        # to do much more complex handling to ensure that arbitrary
        # objects -- such as Django model instances or querysets
        # -- can be serialized as JSON.
        return context


class GetClassSerializerMixin:
    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        """
        return {
            'request': self.request,
            'format': self.format_kwarg,
            'view': self
        }

    def get_serializer_class(self):
        return self.class_serializer

    def get_serializer(self, *args, **kwargs):
        """
        Return the serializer instance that should be used for validating and
        deserializing input, and for serializing output.
        """
        serializer_class = self.get_serializer_class()
        kwargs.setdefault('context', self.get_serializer_context())
        return serializer_class(*args, **kwargs)
