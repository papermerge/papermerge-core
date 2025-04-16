from fastapi import HTTPException


class HTTP403Forbidden(HTTPException):
    def __init__(self, detail: str = "Access Forbidden"):
        super().__init__(status_code=403, detail=detail)


class HTTP404NotFound(HTTPException):
    def __init__(self, detail: str = "Not Found"):
        super().__init__(status_code=404, detail=detail)


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
