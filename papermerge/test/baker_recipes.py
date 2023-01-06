from model_bakery.recipe import Recipe

from papermerge.core.models import Folder, Document, User


folder_recipe = Recipe(Folder)
user_recipe = Recipe(User)
document_recipe = Recipe(Document)
