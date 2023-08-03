from pathlib import PurePath

from model_bakery import baker
from model_bakery.recipe import Recipe

from papermerge.core.models import (BaseTreeNode, Document, DocumentVersion,
                                    Folder, Page, Tag, User)

folder_recipe = Recipe(Folder)
user_recipe = Recipe(User)
document_version_recipe = Recipe(DocumentVersion)
page_recipe = Recipe(Page)
node_recipe = Recipe(BaseTreeNode)

# By default, creates document with 2 versions
document_versions_set = baker.prepare(DocumentVersion, _quantity=2)
document_recipe = Recipe(Document, versions=document_versions_set)
tag_recipe = Recipe(Tag)


def make_folders(breadcrumb: str, user=None):
    """Creates folders from specified breadcrumb.

    Hierarchy (i.e. parent/child) is respected.
    Breadcrumb must include the root folder i.e. .home or .inbox.
    Example of usage:

        >>> lidl_folder = make_folders('.home/My Documents/My Invoices/Lidl')
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
