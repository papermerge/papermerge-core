from papermerge.core import schema
from papermerge.core.features.ownership.db import api as ownership_api
from papermerge.core.types import ResourceType


async def test_basic_tag(make_tag, user, db_session):
    db_tag = await make_tag(name="sent", user=user)
    owned_by = await ownership_api.get_owner_details(
        session=db_session,
        resource_type=ResourceType.TAG,
        resource_id=db_tag.id
    )

    tag = schema.Tag(
        id=db_tag.id,
        name=db_tag.name,
        bg_color=db_tag.bg_color,
        fg_color=db_tag.fg_color,
        pinned=db_tag.pinned,
        description=db_tag.description,
        owned_by=owned_by
    )

    assert tag.name == "sent"
    assert tag.owned_by.id == user.id
    assert tag.owned_by.type == "user"

    assert tag.name == "sent"


def test_model_validate_for_update_tag():
    """PyUpdateTag pydantic model is valid when it
    receives only 'bg_color' and 'name' attributes"""

    model = {
        "bg_color": "#ff0011", "name": "edited_tag_name"}
    tag = schema.UpdateTag.model_validate(model)

    assert tag.name == "edited_tag_name"
