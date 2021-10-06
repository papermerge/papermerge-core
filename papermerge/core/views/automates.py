import logging

from django.http import Http404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from papermerge.core.models import Automate
from papermerge.core.rest.serializers import AutomateSerializer


logger = logging.getLogger(__name__)


class AutomatesList(APIView):
    """
    List all automates, or create a new automate.
    """

    def get(self, request, format=None):
        automates = Automate.objects.all()
        serializer = AutomateSerializer(automates, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = AutomateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AutomateDetail(APIView):
    """
    Retrieve, update or delete a snippet instance.
    """

    def get_object(self, pk):
        try:
            return Automate.objects.get(pk=pk)
        except Automate.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        automate = self.get_object(pk)
        serializer = AutomateSerializer(automate)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        automate = self.get_object(pk)
        serializer = AutomateSerializer(automate, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        automate = self.get_object(pk)
        automate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

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
