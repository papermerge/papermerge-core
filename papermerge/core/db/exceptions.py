class UserNotFound(Exception):
    pass


class PageNotFound(Exception):
    pass


class ResourceAccessDenied(Exception):
    """Raised when user doesn't have permission to access an entity

    Entity: e.g. specific custom field, category, tag etc.
    """
    pass


class DependenciesExist(Exception):
    """Raised when resource cannot be deleted due to existing dependencies

    e.g. user tries to delete document type, but there are still
    custom fields or documents associated with it
    """
    pass


class InvalidRequest(Exception):
    pass


class ResourceHasNoOwner(Exception):
    pass
