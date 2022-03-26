from knox.views import LogoutView as KnoxLogoutView
from knox.views import LogoutAllView as KnoxLogoutAllView


class LogoutView(KnoxLogoutView):
    def get_serializer(self, *args, **kwargs):
        return None


class LogoutAllView(KnoxLogoutAllView):
    def get_serializer(self, *args, **kwargs):
        return None
