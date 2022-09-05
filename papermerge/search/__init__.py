from django.conf import settings
from papermerge.search.utils import loading

connections = loading.ConnectionHandler(
    settings.PAPERMERGE_SEARCH_CONNECTIONS
)
