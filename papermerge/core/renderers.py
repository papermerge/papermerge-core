from django.utils.encoding import smart_str
from rest_framework import renderers


class PlainTextRenderer(renderers.BaseRenderer):
    media_type = 'text/plain'
    format = 'txt'

    def render(self, data, media_type=None, renderer_context=None):
        return smart_str(data, encoding=self.charset)


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
