class UserNotFound(Exception):
    pass


class PageNotFound(Exception):
    pass

class ResourceAccessDenied(Exception):
    """Raised when user doesn't have permission to access an entity

    Entity: e.g. specific custom field, category, tag etc.
    """
    pass
