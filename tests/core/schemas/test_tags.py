import pytest

from papermerge.core.schemas import Tag as PyTag
from papermerge.core.schemas import UpdateTag as PyUpdateTag
from papermerge.test.baker_recipes import tag_recipe


@pytest.mark.django_db
def test_pytag():
    tag = tag_recipe.make(name='red')

    pytag = PyTag.model_validate(tag)

    assert pytag.name == 'red'


def test_model_validate_for_updatetag():
    """PyUpdateTag pydantic model is valid when it
    receives only 'bg_color' and 'name' attributes"""

    model = {
        'bg_color': '#ff0011',
        'name': 'edited_tag_name'
    }
    pytag = PyUpdateTag.model_validate(model)

    assert pytag.name == 'edited_tag_name'
