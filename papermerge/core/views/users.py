import logging

from django.contrib import messages
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.translation import ugettext_lazy as _
from django.http import HttpResponseForbidden

from rest_framework_json_api.views import ModelViewSet

from papermerge.core.serializers import UserSerializer
from papermerge.core.models import User

logger = logging.getLogger(__name__)


class UsersViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


@login_required
def user_view(request):
    pass


@login_required
def user_change_view(request, id):
    pass


@login_required
def user_change_password_view(request, id):
    """
    This view is used by administrator to change password of ANY user in the
    system. As result, 'current password' won't be asked.
    """

    if not request.user.is_superuser:
        return HttpResponseForbidden()

    user = get_object_or_404(User, id=id)
    action_url = reverse('core:user_change_password', args=(id,))

    if request.method == 'POST':
        password1 = request.POST['password1']
        password2 = request.POST['password2']
        if password1 == password2:
            user.set_password(password1)
            user.save()
            messages.success(
                request,
                _("Password was successfully changed.")
            )
            return redirect(
                reverse('core:user_change', args=(id,))
            )

    return render(
        request,
        'admin/user_change_password.html',
        {
            'user': user,
            'action_url': action_url
        }
    )
