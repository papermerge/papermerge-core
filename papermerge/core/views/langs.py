from django.contrib.auth.decorators import login_required

from papermerge.core.lib.lang import get_ocr_langs
from .decorators import json_response


@json_response
@login_required
def langs_view(request):
    ocr_langs = [
        {'title': lang[1], 'value': lang[0]}
        for lang in get_ocr_langs()
    ]
    return {'ocr_langs': ocr_langs}
