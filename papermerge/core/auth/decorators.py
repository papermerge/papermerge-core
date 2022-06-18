from functools import wraps

from django.core.exceptions import PermissionDenied


def permission_required(name):
    """
    Grants access to DRF View method only if user has permission

    Example of usage:

        class SomeView(GenericAPIView):

            @permission_required('change_group')
            def post(self, request):
                # reaches this place only if user has `change_group` perm
                pass
    """
    def wrap(func):
        @wraps(func)
        def inner(self, *args, **kwargs):
            if hasattr(self, 'request'):
                if hasattr(self.request, 'user'):
                    if self.request.user.has_perm(f"core.{name}"):
                        return func(self, *args, **kwargs)

            raise PermissionDenied

        return inner

    return wrap
