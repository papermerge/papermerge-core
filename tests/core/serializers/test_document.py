import pytest

from papermerge.core.serializers import DocumentSerializer
from papermerge.test.baker_recipes import (
    user_recipe,
    folder_recipe,
    document_recipe
)


@pytest.mark.django_db
def test_document_serializer_for_correct_breadcrumb():
    user = user_recipe.make()
    my_documents = folder_recipe.make(
        title="My Documents",
        parent=user.home_folder
    )
    my_rechnungen = folder_recipe.make(
        title="My Rechnungen",
        user=user,
        parent=my_documents
    )
    lidl_recipe = document_recipe.make(
        title="lidl.pdf",
        user=user,
        parent=my_rechnungen
    )

    ser = DocumentSerializer(lidl_recipe)

    assert ser.data['breadcrumb'] == '.home/My Documents/My Rechnungen/lidl.pdf'
