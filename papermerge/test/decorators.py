from functools import wraps

from django.contrib.auth.models import Permission


def apply_permissions(user, name, *names):

    perm_names = (name, ) + names

    permissions = Permission.objects.filter(
        codename__in=perm_names
    )

    if not permissions:
        raise ValueError(
            f"Permission(s) {perm_names} not found"
        )

    if permissions.count() != len(perm_names):
        raise ValueError(
            f"Some of permissions {perm_names} not found"
        )
    user.user_permissions.add(*permissions)


def perms(name, *names):

    def wrap(func):
        @wraps(func)
        def inner(self, *args, **kwargs):
            if hasattr(self, 'user'):
                apply_permissions(self.user, name, *names)
            return func(self, *args, **kwargs)

        return inner

    return wrap
