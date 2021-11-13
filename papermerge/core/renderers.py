from django.utils.encoding import smart_text
from rest_framework import renderers


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
    media_type = 'image/svg'
    format = 'svg'

    def render(self, data, media_type=None, renderer_context=None):
        return data
