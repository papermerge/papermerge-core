from django.utils.encoding import smart_text
from rest_framework import renderers


class PassthroughRenderer(renderers.BaseRenderer):
    """Return data as-is. View should supply a Response."""
    media_type = ''
    format = ''

    def render(
        self,
        data,
        accepted_media_type=None,
        renderer_context=None
    ):
        return data


class PlainTextRenderer(renderers.BaseRenderer):
    media_type = 'text/plain'
    format = 'txt'

    def render(self, data, media_type=None, renderer_context=None):
        return smart_text(data, encoding=self.charset)


class ImageJpegRenderer(renderers.BaseRenderer):
    media_type = 'image/jpeg'
    format = 'jpeg'
    render_style = 'binary'

    def render(self, data, media_type=None, renderer_context=None):
        return data


class ImageSVGRenderer(renderers.BaseRenderer):
    media_type = 'image/svg+xml'
    format = 'svg'

    def render(self, data, media_type=None, renderer_context=None):
        return data
