from django.conf import settings
from papermerge.search.utils import loading

connections = loading.ConnectionHandler({
    'engine': settings.PAPERMERGE__SEARCH__ENGINE,
    'url': settings.PAPERMERGE__SEARCH__URL
})
