from papermerge.core.features.auth.scopes import Scopes
from papermerge.core.features.auth.dependencies import require_scopes
from papermerge.core.schema import User

ViewCustomFields: type[User] = require_scopes(Scopes.CUSTOM_FIELD_VIEW)
CreateCustomFields: type[User] = require_scopes(Scopes.CUSTOM_FIELD_CREATE)
DeleteCustomFields: type[User] = require_scopes(Scopes.CUSTOM_FIELD_DELETE)
UpdateCustomFields: type[User] = require_scopes(Scopes.CUSTOM_FIELD_UPDATE)

__all__ = [
    "ViewCustomFields",
    "CreateCustomFields",
    "DeleteCustomFields",
    "UpdateCustomFields"
]
