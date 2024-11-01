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
