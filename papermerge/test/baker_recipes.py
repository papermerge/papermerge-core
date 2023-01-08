from model_bakery.recipe import Recipe

from papermerge.core.models import Folder, Document, DocumentVersion, User


folder_recipe = Recipe(Folder)
user_recipe = Recipe(User)
document_version_recipe = Recipe(DocumentVersion)
document_recipe = Recipe(Document)
