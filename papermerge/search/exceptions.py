class PapermergeSearchError(Exception):
    """A generic exception for all others to extend."""
    pass


class SearchBackendError(PapermergeSearchError):
    """Raised when a backend can not be found."""
    pass


class SearchFieldError(PapermergeSearchError):
    """Raised when a field encounters an error."""
    pass


class MissingDependency(PapermergeSearchError):
    """Raised when a library a backend depends on can not be found."""
    pass


class NotHandled(PapermergeSearchError):
    """Raised when a model is not handled by the router setup."""
    pass


class MoreLikeThisError(PapermergeSearchError):
    """Raised when a model instance has not been provided for More Like This."""
    pass


class FacetingError(PapermergeSearchError):
    """Raised when incorrect arguments have been provided for faceting."""

    pass


class SpatialError(PapermergeSearchError):
    """Raised when incorrect arguments have been provided for spatial."""
    pass


class StatsError(PapermergeSearchError):
    "Raised when incorrect arguments have been provided for stats"
    pass


class SkipDocument(PapermergeSearchError):
    """Raised when a document should be skipped while updating"""
    pass
