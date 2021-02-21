import json
import logging

from django.contrib.auth.decorators import login_required
from django.http import (
    Http404,
    HttpResponse,
    HttpResponseForbidden
)

from papermerge.core.models import (
    BaseTreeNode,
    Page,
    Access
)

from papermerge.core.models.kvstore import (get_currency_formats,
                                            get_date_formats, get_kv_types,
                                            get_numeric_formats)

from .utils import sanitize_kvstore_list

logger = logging.getLogger(__name__)


@login_required
def metadata(request, model, id):
    """
    model can be either node or page. Respectively
    id will be the 'id' of either node or page.
    E.g.
    POST /metadata/page/55 # will update metadata for page id=55
    POST /metadata/node/40 # will update metadata for node id=40
    """
    node = None
    if model == 'node':
        _Klass = BaseTreeNode
        # if queried node is a document, then instead
        # of document's metadata - metadata of first page
        # of respective document will be returned.
        node = BaseTreeNode.objects.get(id=id)
        if node.is_document():
            # will return first page
            # i.e. page with lowerest page.number
            # attribute
            _Klass = Page
            id = node.pages.first().id
    else:
        _Klass = Page

    try:
        item = _Klass.objects.get(id=id)
    except _Klass.DoesNotExist:
        raise Http404("Node does not exists")

    # allow access to metadata only if user has read permissions
    # on the document.
    document_or_node = node
    if model == 'page':
        document_or_node = item.document

    if not request.user.has_perm(
        Access.PERM_READ,
        document_or_node
    ):
        return HttpResponseForbidden()

    kvstore = []

    if request.method == 'GET':
        for kv in item.kv.all():
            kvstore.append(kv.to_dict())
    else:
        # Note that for a document metadata can be updated in two ways:
        #
        #   1) POST /metadata/node/:id - request issued from document browser
        #        :id is the ``id`` of respective node
        #   2) POST /metadata/page/:id i.e. - request issued from document
        #       viewer. :id in this case is ``id`` of first page of the
        #       document.
        #
        # For case 1) the key/value will be applied on the document and
        # propagated to the first page while for 2) the update is applied to
        # the page and not propagated as page models are leaf elements.
        #
        # This slight inconsistency works because document metadata is not used
        # at all. Instead what user thinks is document's metadata is actually
        # metadata of the first page of the document.
        if isinstance(item, BaseTreeNode):
            node = item
        else:
            node = item.document

        if request.user.has_perm(Access.PERM_WRITE, node):
            kv_data = json.loads(request.body)
            if 'kvstore' in kv_data:
                if isinstance(kv_data['kvstore'], list):
                    item.kv.update(
                        sanitize_kvstore_list(kv_data['kvstore'])
                    )
        else:
            return HttpResponseForbidden()

    return HttpResponse(
        json.dumps(
            {
                'kvstore': kvstore,
                'currency_formats': get_currency_formats(),
                'date_formats': get_date_formats(),
                'numeric_formats': get_numeric_formats(),
                'kv_types': get_kv_types()

            }
        ),
        content_type="application/json"
    )
