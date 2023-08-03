import pytest

from papermerge.core.schemas.documents import Page as PyPage
from papermerge.test.baker_recipes import page_recipe


@pytest.mark.django_db
def test_pypage_model_validation():
    page = page_recipe.make()
    pypage = PyPage.model_validate(page)

    assert pypage.jpg_url == f"/api/pages/{page.id}/jpg"
    assert pypage.svg_url == f"/api/pages/{page.id}/svg"
