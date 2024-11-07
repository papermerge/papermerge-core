from papermerge.core import schema


def test_basic_tag(make_tag, user):
    db_tag = make_tag(name="sent", user=user)
    tag = schema.Tag.model_validate(db_tag)

    assert tag.name == "sent"


def test_model_validate_for_update_tag():
    """PyUpdateTag pydantic model is valid when it
    receives only 'bg_color' and 'name' attributes"""

    model = {"bg_color": "#ff0011", "name": "edited_tag_name"}
    tag = schema.UpdateTag.model_validate(model)

    assert tag.name == "edited_tag_name"
