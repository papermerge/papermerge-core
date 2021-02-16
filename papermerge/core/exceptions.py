"""
Global Papermerge exception and warning classes.
"""


class SuperuserDoesNotExist(Exception):
    """
    Raised when superuser was not found.
    Papermerge must have at least one superuser.
    """
    pass
