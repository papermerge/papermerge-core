import logging

from rest_framework_json_api.views import ModelViewSet

from papermerge.core.models import Automate
from papermerge.core.serializers import AutomateSerializer


logger = logging.getLogger(__name__)


class AutomatesViewSet(ModelViewSet):
    queryset = Automate.objects.all()
    serializer_class = AutomateSerializer


#@json_response
#@login_required
#def automate_view(request):
#    """
#    If no particular automate is asked for, just return
#    list of all tags (which might be associated to the new automate)
#    """
#    tags = Tag.objects.filter(user=request.user)
#
#    response = {
#        'tags': [],
#        'alltags': [tag.to_dict() for tag in tags]
#    }
#
#    return response
#
#
#@json_response
#@login_required
#def automate_change_view(request, automate_id):
#    """
#    Returns details of the automate specified with given id
#    """
#    automate = get_object_or_404(Automate, id=automate_id)
#    tags = automate.tags.all()
#    alltags = Tag.objects.filter(user=request.user)
#
#    response = {
#        'name': automate.name,
#        'id': automate_id,
#        'tags': [tag.to_dict() for tag in tags],
#        'alltags': [tag.to_dict() for tag in alltags],
#    }
#
#    return response
