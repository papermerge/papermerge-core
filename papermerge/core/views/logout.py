from drf_spectacular.utils import extend_schema

from knox.views import LogoutView as KnoxLogoutView
from knox.views import LogoutAllView as KnoxLogoutAllView


@extend_schema(
    operation_id="Logout",
)
class LogoutView(KnoxLogoutView):
    """
    Logs the user out of current session.

    On a successful request, the token used to authenticate is deleted from the
    system and can no longer be used for authentication.

    Request body must be empty.
    """
    def get_serializer(self, *args, **kwargs):
        return None


@extend_schema(
    operation_id="Logout All",
)
class LogoutAllView(KnoxLogoutAllView):
    """
    Logs the user out of all sessions i.e. deletes all auth tokens for the user.

    On a successful request, the token used to authenticate, and all other
    tokens registered to the same user account, are deleted from the system
    and can no longer be used for authentication.

    Request body must be empty.
    """
    def get_serializer(self, *args, **kwargs):
        return None
