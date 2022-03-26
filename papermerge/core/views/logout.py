from drf_spectacular.utils import extend_schema

from knox.views import LogoutView as KnoxLogoutView
from knox.views import LogoutAllView as KnoxLogoutAllView


@extend_schema(
    operation_id="Logout"
)
class LogoutView(KnoxLogoutView):
    """
    Logs the user out of current session.
    """
    def get_serializer(self, *args, **kwargs):
        return None


@extend_schema(
    operation_id="Logout All",
)
class LogoutAllView(KnoxLogoutAllView):
    """
    Logs the user out of all sessions i.e. deletes all auth tokens for the user
    """
    def get_serializer(self, *args, **kwargs):
        return None
