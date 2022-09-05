from django.conf import settings
from papermerge.search.utils import loading

connections = loading.ConnectionHandler({
    'ENGINE': settings.PAPERMERGE__SEARCH__ENGINE,
    'URL': settings.PAPERMERGE__SEARCH__URL
})
