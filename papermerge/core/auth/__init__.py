
from django.contrib.auth import get_user_model
from rest_framework.permissions import DjangoModelPermissions

# custom user is used - papermerge.core.models.User
User = get_user_model()


class CustomModelPermissions(DjangoModelPermissions):
    """
    The request is authenticated using `django.contrib.auth` permissions.
    See: https://docs.djangoproject.com/en/dev/topics/auth/#permissions

    It ensures that the user is authenticated, and has the appropriate
    `view`/`add`/`change`/`delete` permissions on the model.
    """
    # Overrides perms_map of `DjangoModelPermissions` with value for 'GET',
    # 'HEAD' and 'OPTIONS' keys
    perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': ['%(app_label)s.view_%(model_name)s'],
        'HEAD': ['%(app_label)s.view_%(model_name)s'],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }
