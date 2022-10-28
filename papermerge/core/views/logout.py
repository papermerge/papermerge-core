from knox.views import LogoutView as KnoxLogoutView
from knox.views import LogoutAllView as KnoxLogoutAllView


class LogoutView(KnoxLogoutView):
    """
    Logs the user out of current session.

    On a successful request, the token used to authenticate is deleted from the
    system and can no longer be used for authentication.

    Request body must be empty.
    """
    def get_serializer(self, *args, **kwargs):
        return None


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
