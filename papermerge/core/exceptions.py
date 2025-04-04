from fastapi import HTTPException

class HTTP403Forbidden(HTTPException):
    detail = "Access Forbidden"
    status_code = 403


class HTTP404NotFound(HTTPException):
    detail = "Not Found"
    status_code = 404


class SuperuserDoesNotExist(Exception):
    """
    Raised when superuser was not found.
    Papermerge must have at least one superuser.
    """

    pass


class FileTypeNotSupported(Exception):
    """File type not supported"""

    pass


class InvalidDateFormat(Exception):
    pass


class EntityNotFound(Exception):
    pass
