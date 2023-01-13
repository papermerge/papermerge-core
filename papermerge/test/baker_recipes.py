from pathlib import PurePath

from model_bakery.recipe import Recipe

from papermerge.core.models import Folder, Document, DocumentVersion, User


folder_recipe = Recipe(Folder)
user_recipe = Recipe(User)
document_version_recipe = Recipe(DocumentVersion)
document_recipe = Recipe(Document)


def make_folders(breadcrumb: str, user=None):
    """Creates folders from specified breadcrumb.

    Hierarchy (i.e. parent/child) is respected.
    """
    if user is None:
        user = user_recipe.make()

    parts = PurePath(breadcrumb).parts
    parent = Folder.objects.get(title=parts[0], user=user)
    # parts[1:] excludes top most folders (.home, .inbox) which were
    # created before as part of user model creation
    for item in parts[1:]:
        parent = folder_recipe.make(
            title=item,
            user=user,
            parent=parent
        )

    return parent
