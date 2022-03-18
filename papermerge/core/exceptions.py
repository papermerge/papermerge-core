"""
Global Papermerge exception and warning classes.
"""
from rest_framework.exceptions import APIException


class APIBadRequest(APIException):
    status_code = 400


class SuperuserDoesNotExist(Exception):
    """
    Raised when superuser was not found.
    Papermerge must have at least one superuser.
    """
    pass


class FileTypeNotSupported(Exception):
    """File type not supported"""
    pass
